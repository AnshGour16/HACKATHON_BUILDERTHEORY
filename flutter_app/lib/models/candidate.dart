class Candidate {
  final String id;
  final String name;
  final String email;
  final String role;
  final int matchScore;
  final String status;
  final List<String> skills;
  final String? githubUrl;
  final String? resumeSummary;
  final Map<String, double> rubricBreakdown;

  const Candidate({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.matchScore,
    required this.status,
    required this.skills,
    this.githubUrl,
    this.resumeSummary,
    this.rubricBreakdown = const {},
  });

  factory Candidate.fromJson(Map<String, dynamic> json) {
    return Candidate(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name'] ?? 'Candidate',
      email: json['email'] ?? '',
      role: json['role'] ?? json['track'] ?? 'General',
      matchScore: json['matchScore'] ?? json['score'] ?? 85,
      status: json['status'] ?? 'New',
      skills: (json['skills'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['Flutter', 'Dart', 'Git'],
      githubUrl: json['githubUrl'],
      resumeSummary: json['summary'],
      rubricBreakdown: (json['rubricBreakdown'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(k, (v as num).toDouble()),
          ) ??
          {
            'Core Skills': 92.0,
            'Execution Quality': 88.5,
            'Architecture & Modularity': 85.0,
          },
    );
  }
}
