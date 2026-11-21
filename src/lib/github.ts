export interface IValidatedGithubUrl {
    valid: boolean;
    error?: string;
    owner?: string;
    repo?: string;
    normalizedUrl?: string;
}

export interface IGitHubMeta {
    language?: string;
    stars?: number;
    forks?: number;
    openIssues?: number;
    defaultBranch?: string;
    sizeKb?: number;
    description?: string;
    hasTests?: boolean;
    hasCi?: boolean;
    commitCountSampled?: number;
    totalFilesSampled?: number;
}

export interface IGitHubFetchResult {
    success: boolean;
    error?: string;
    isRateLimited?: boolean;
    isNotFoundOrPrivate?: boolean;
    owner?: string;
    repo?: string;
    normalizedUrl?: string;
    contextText?: string;
    meta?: IGitHubMeta;
}

/**
 * Validates a GitHub repository URL strictly.
 * Prevents SSRF by ensuring only safe alphanumeric/dash/underscore/dot owner/repo strings
 * pointing exclusively to github.com are accepted.
 */
export function validateAndNormalizeGithubUrl(inputUrl: string): IValidatedGithubUrl {
    if (!inputUrl || typeof inputUrl !== 'string') {
        return { valid: false, error: 'A GitHub repository URL is required.' };
    }

    const trimmed = inputUrl.trim();

    // Guard against path traversal sequences
    if (trimmed.includes('..') || trimmed.toLowerCase().includes('%2e')) {
        return { valid: false, error: 'Path traversal sequences are not permitted.' };
    }

    let urlObj: URL;
    try {
        urlObj = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    } catch {
        return { valid: false, error: 'Malformed URL provided. Please enter a valid URL.' };
    }

    // Strict domain check: only github.com
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') {
        return { valid: false, error: 'Only repositories hosted on github.com are accepted.' };
    }

    // Split pathname: /owner/repo[/...]
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
        return { valid: false, error: 'URL must contain both owner and repository name (e.g., https://github.com/owner/repo).' };
    }

    const rawOwner = pathParts[0];
    const rawRepo = pathParts[1].replace(/\.git$/i, '');

    // Reserved routes on github.com that are not repositories
    const reserved = new Set([
        'admin', 'settings', 'orgs', 'features', 'pricing', 'marketplace', 'explore',
        'topics', 'collections', 'events', 'pulls', 'issues', 'notifications',
        'login', 'join', 'about', 'contact', 'security', 'trending'
    ]);

    if (reserved.has(rawOwner.toLowerCase())) {
        return { valid: false, error: `"${rawOwner}" is a reserved GitHub path, not a valid user or organization.` };
    }

    // SSRF / Injection Guard: strictly validate owner and repo tokens
    const validIdentifier = /^[a-zA-Z0-9_.-]+$/;
    if (!validIdentifier.test(rawOwner) || !validIdentifier.test(rawRepo)) {
        return { valid: false, error: 'Repository owner or name contains invalid characters.' };
    }

    const normalizedUrl = `https://github.com/${rawOwner}/${rawRepo}`;
    return {
        valid: true,
        owner: rawOwner,
        repo: rawRepo,
        normalizedUrl
    };
}

/**
 * Builds request headers for GitHub REST API, safely including authorization if GITHUB_TOKEN is configured.
 */
function getGitHubHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Hackathon-ATS'
    };

    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Inspects and scrapes a public GitHub repository using GitHub's REST API.
 * Gathers metadata, README, directory tree, dependency manifests, key source files, and commit history.
 */
export async function fetchGithubData(githubUrl: string): Promise<IGitHubFetchResult> {
    const validation = validateAndNormalizeGithubUrl(githubUrl);
    if (!validation.valid || !validation.owner || !validation.repo || !validation.normalizedUrl) {
        return {
            success: false,
            error: validation.error || 'Invalid GitHub URL.'
        };
    }

    const { owner, repo, normalizedUrl } = validation;
    const headers = getGitHubHeaders();

    try {
        // 1. Fetch Repository Metadata
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (repoRes.status === 404) {
            return {
                success: false,
                isNotFoundOrPrivate: true,
                error: 'Repository not found or private. Ensure the repository is public and accessible on GitHub.'
            };
        }

        if (repoRes.status === 403 || repoRes.status === 429) {
            const rateLimitRemaining = repoRes.headers.get('x-ratelimit-remaining');
            return {
                success: false,
                isRateLimited: true,
                error: rateLimitRemaining === '0'
                    ? 'GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN in your environment or retry later.'
                    : 'Access to GitHub API was temporarily restricted (HTTP 403).'
            };
        }

        if (!repoRes.ok) {
            return {
                success: false,
                error: `GitHub API returned error ${repoRes.status}: ${repoRes.statusText}`
            };
        }

        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';
        const meta: IGitHubMeta = {
            language: repoData.language || 'Unknown',
            stars: repoData.stargazers_count || 0,
            forks: repoData.forks_count || 0,
            openIssues: repoData.open_issues_count || 0,
            defaultBranch,
            sizeKb: repoData.size || 0,
            description: repoData.description || 'None provided'
        };

        // 2. Fetch README.md
        let readmeContent = '';
        try {
            const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
            if (readmeRes.ok) {
                const readmeData = await readmeRes.json();
                if (readmeData.content && typeof readmeData.content === 'string') {
                    readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
                }
            }
        } catch (e) {
            console.warn(`[GitHub Scraper] Could not fetch README for ${owner}/${repo}:`, e);
        }

        // 3. Fetch Directory Tree
        let treeSummary = '';
        let manifestPaths: string[] = [];
        let candidateSourceFiles: string[] = [];
        let hasTests = false;
        let hasCi = false;
        let totalFilesSampled = 0;

        try {
            const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
            if (treeRes.ok) {
                const treeData = await treeRes.json();
                if (Array.isArray(treeData.tree)) {
                    totalFilesSampled = treeData.tree.length;
                    const paths: string[] = treeData.tree
                        .filter((item: { path?: string; type?: string }) => item.type === 'blob' && item.path)
                        .map((item: { path: string }) => item.path);

                    // Check for tests
                    hasTests = paths.some(p =>
                        /(^|\/)(tests?|__tests__|spec)\//i.test(p) ||
                        /\.(test|spec)\.[a-zA-Z0-9]+$/i.test(p)
                    );

                    // Check for CI/CD
                    hasCi = paths.some(p =>
                        p.startsWith('.github/workflows/') ||
                        p === 'Dockerfile' ||
                        p === 'docker-compose.yml' ||
                        p === '.gitlab-ci.yml'
                    );

                    // Identify dependency manifests
                    const manifestCandidates = ['package.json', 'requirements.txt', 'Pipfile', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle'];
                    manifestPaths = paths.filter(p => manifestCandidates.some(m => p.endsWith(m) || p === m));

                    // Identify key entrypoint / source files (bounded to 2-3 files)
                    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cpp', '.c'];
                    candidateSourceFiles = paths.filter(p => {
                        const isSource = sourceExtensions.some(ext => p.endsWith(ext));
                        const isNotTest = !/(test|spec|__tests__|min\.js|bundle)/i.test(p);
                        const isNotVendor = !/(node_modules|vendor|\.next|dist|build)/i.test(p);
                        return isSource && isNotTest && isNotVendor;
                    }).slice(0, 3);

                    // Create compact tree summary of first 40 files/folders
                    treeSummary = paths.slice(0, 40).map(p => `  - ${p}`).join('\n');
                    if (paths.length > 40) {
                        treeSummary += `\n  ... and ${paths.length - 40} more files`;
                    }
                }
            }
        } catch (e) {
            console.warn(`[GitHub Scraper] Could not fetch tree for ${owner}/${repo}:`, e);
        }

        meta.hasTests = hasTests;
        meta.hasCi = hasCi;
        meta.totalFilesSampled = totalFilesSampled;

        // 4. Fetch Dependency Manifests
        let manifestContent = '';
        if (manifestPaths.length > 0) {
            const primaryManifest = manifestPaths[0];
            try {
                const manifestRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${primaryManifest}`, { headers });
                if (manifestRes.ok) {
                    const manifestData = await manifestRes.json();
                    if (manifestData.content) {
                        const rawDecoded = Buffer.from(manifestData.content, 'base64').toString('utf-8');
                        if (primaryManifest.endsWith('package.json')) {
                            try {
                                const parsed = JSON.parse(rawDecoded);
                                manifestContent = `Manifest (${primaryManifest}):\n` + JSON.stringify({
                                    name: parsed.name,
                                    dependencies: parsed.dependencies,
                                    devDependencies: parsed.devDependencies
                                }, null, 2);
                            } catch {
                                manifestContent = `Manifest (${primaryManifest}):\n${rawDecoded.substring(0, 1500)}`;
                            }
                        } else {
                            manifestContent = `Manifest (${primaryManifest}):\n${rawDecoded.substring(0, 1500)}`;
                        }
                    }
                }
            } catch (e) {
                console.warn(`[GitHub Scraper] Could not fetch manifest for ${owner}/${repo}:`, e);
            }
        }

        // 5. Fetch Key Sample Source Files (up to 2 files, max 1500 chars each)
        let sampleSourceFiles = '';
        for (const filePath of candidateSourceFiles.slice(0, 2)) {
            try {
                const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, { headers });
                if (fileRes.ok) {
                    const fileData = await fileRes.json();
                    if (fileData.content) {
                        const decoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
                        sampleSourceFiles += `\n--- Sample Source File: ${filePath} ---\n${decoded.substring(0, 1500)}\n`;
                    }
                }
            } catch (e) {
                console.warn(`[GitHub Scraper] Could not fetch source file ${filePath}:`, e);
            }
        }

        // 6. Fetch Recent Commits (up to 15)
        let commitSummary = '';
        try {
            const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=15`, { headers });
            if (commitsRes.ok) {
                const commitsData = await commitsRes.json();
                if (Array.isArray(commitsData)) {
                    meta.commitCountSampled = commitsData.length;
                    commitSummary = commitsData
                        .map((c: { commit?: { message?: string; author?: { date?: string; name?: string } } }) =>
                            `- ${c.commit?.author?.date || 'Unknown Date'} by ${c.commit?.author?.name || 'Contributor'}: ${(c.commit?.message || '').split('\n')[0]}`
                        )
                        .join('\n');
                }
            }
        } catch (e) {
            console.warn(`[GitHub Scraper] Could not fetch commits for ${owner}/${repo}:`, e);
        }

        // 7. Compile bounded context string for Gemini
        let combinedContext = `--- GITHUB REPOSITORY AUDIT ---\n`;
        combinedContext += `Repository: ${owner}/${repo}\n`;
        combinedContext += `URL: ${normalizedUrl}\n`;
        combinedContext += `Primary Language: ${meta.language}\n`;
        combinedContext += `Stars: ${meta.stars} | Forks: ${meta.forks} | Open Issues: ${meta.openIssues}\n`;
        combinedContext += `Description: ${meta.description}\n`;
        combinedContext += `Automated Tests Detected: ${hasTests ? 'YES' : 'NONE DETECTED'}\n`;
        combinedContext += `CI/CD Configuration Detected: ${hasCi ? 'YES' : 'NONE DETECTED'}\n`;
        combinedContext += `Total Sampled Files: ${totalFilesSampled}\n\n`;

        if (treeSummary) {
            combinedContext += `--- DIRECTORY AND FILE STRUCTURE ---\n${treeSummary}\n\n`;
        }

        if (manifestContent) {
            combinedContext += `--- DEPENDENCY MANIFEST ---\n${manifestContent}\n\n`;
        }

        if (readmeContent) {
            combinedContext += `--- README.md (Truncated to 4000 chars) ---\n${readmeContent.substring(0, 4000)}\n\n`;
        }

        if (sampleSourceFiles) {
            combinedContext += `--- SOURCE CODE SNIPPETS ---\n${sampleSourceFiles}\n\n`;
        }

        if (commitSummary) {
            combinedContext += `--- RECENT COMMIT ACTIVITY (Up to 15) ---\n${commitSummary}\n\n`;
        }

        return {
            success: true,
            owner,
            repo,
            normalizedUrl,
            contextText: combinedContext,
            meta
        };

    } catch (error: unknown) {
        console.error(`[GitHub Scraper] Fatal error fetching ${owner}/${repo}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to communicate with GitHub API.'
        };
    }
}
