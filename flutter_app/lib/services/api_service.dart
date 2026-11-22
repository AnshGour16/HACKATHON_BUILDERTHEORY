import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/candidate.dart';
import '../models/job.dart';

class ApiService {
  // Configured default baseUrl pointing to HireSphere backend
  static const String baseUrl = 'http://localhost:3000/api';

  static Future<List<Candidate>> fetchCandidates() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/applications'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['applications'] is List) {
          return (data['applications'] as List)
              .map((c) => Candidate.fromJson(c))
              .toList();
        }
      }
    } catch (_) {
      // Fallback sample data matching YouKT reference screens
    }

    return const [
      Candidate(
        id: '1',
        name: 'Damson',
        email: 'damson@example.com',
        role: 'Senior Software Engineer',
        matchScore: 95,
        status: 'New',
        skills: ['Python', 'SQL', 'Project Management'],
        githubUrl: 'https://github.com/organization/repo-alpha',
        resumeSummary: 'Experienced software architect specialized in distributed systems and cloud infrastructure.',
        rubricBreakdown: {
          'Core Skills': 96.0,
          'Architecture & Modularity': 94.0,
          'Code Hygiene & Testing': 95.0,
        },
      ),
      Candidate(
        id: '2',
        name: 'Sarah',
        email: 'sarah@example.com',
        role: 'Growth Marketing Lead',
        matchScore: 89,
        status: 'Under Review',
        skills: ['Python', 'SQL', 'Project Management'],
        resumeSummary: 'Demonstrated excellence in inbound funnel optimization and cohort retention analytics.',
        rubricBreakdown: {
          'Inbound & Growth': 95.4,
          'Attention to Detail': 82.5,
          'Domain Skills': 70.0,
        },
      ),
      Candidate(
        id: '3',
        name: 'Darmant',
        email: 'darmant@example.com',
        role: 'Backend Architect',
        matchScore: 87,
        status: 'Contacted',
        skills: ['Python', 'SQL', 'SQL'],
        githubUrl: 'https://github.com/organization/core-backend',
        rubricBreakdown: {
          'System Design': 90.0,
          'Database Tuning': 85.0,
          'Security Analysis': 86.0,
        },
      ),
      Candidate(
        id: '4',
        name: 'Ravatan',
        email: 'ravatan@example.com',
        role: 'Full-Stack Developer',
        matchScore: 87,
        status: 'New',
        skills: ['Python', 'SQL', 'Project Management'],
      ),
      Candidate(
        id: '5',
        name: 'Jinia',
        email: 'jinia@example.com',
        role: 'Data Scientist',
        matchScore: 87,
        status: 'Under Review',
        skills: ['Python', 'SQL', 'Project Management'],
      ),
      Candidate(
        id: '6',
        name: 'Salian',
        email: 'salian@example.com',
        role: 'DevOps Engineer',
        matchScore: 87,
        status: 'Contacted',
        skills: ['Python', 'SQL', 'Docker'],
      ),
    ];
  }

  static Future<List<JobListing>> fetchJobs() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/jobs'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['jobs'] is List) {
          return (data['jobs'] as List)
              .map((j) => JobListing.fromJson(j))
              .toList();
        }
      }
    } catch (_) {}

    return const [
      JobListing(
        id: '1',
        title: 'Senior Software Engineer',
        department: 'Software and IT',
        location: 'Remote',
        type: 'Full-time',
        evaluationType: 'TECHNICAL_GITHUB',
        applicantCount: 24,
        status: 'Active',
      ),
      JobListing(
        id: '2',
        title: 'Growth Marketing Lead',
        department: 'Marketing',
        location: 'New York, NY',
        type: 'Full-time',
        evaluationType: 'NON_TECHNICAL_ASSIGNMENT',
        applicantCount: 18,
        status: 'Active',
      ),
      JobListing(
        id: '3',
        title: 'Sales Development Manager',
        department: 'Sales',
        location: 'Austin, TX',
        type: 'Full-time',
        evaluationType: 'NON_TECHNICAL_ASSIGNMENT',
        applicantCount: 15,
        status: 'Active',
      ),
    ];
  }
}
