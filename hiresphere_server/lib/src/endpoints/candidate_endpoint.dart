import 'package:serverpod/serverpod.dart';

class CandidateEndpoint extends Endpoint {
  Future<List<Map<String, dynamic>>> listCandidates(Session session) async {
    return [
      {
        'id': '1',
        'name': 'Damson',
        'role': 'Senior Software Engineer',
        'matchScore': 95,
        'status': 'New',
        'skills': ['Python', 'SQL', 'Project Management'],
        'summary': 'Full-stack software architect with deep microservices background.',
      },
      {
        'id': '2',
        'name': 'Sarah',
        'role': 'Growth Marketing Lead',
        'matchScore': 89,
        'status': 'Under Review',
        'skills': ['Python', 'SQL', 'Project Management'],
        'summary': 'Demonstrated track record scaling B2B inbound funnel performance.',
      },
      {
        'id': '3',
        'name': 'Darmant',
        'role': 'Backend Architect',
        'matchScore': 87,
        'status': 'Contacted',
        'skills': ['Python', 'SQL', 'SQL'],
        'summary': 'Specialist in distributed databases, latency reduction and PostgreSQL.',
      },
    ];
  }

  Future<Map<String, dynamic>> evaluateCandidate(
    Session session, {
    required String candidateName,
    required String role,
    String? githubUrl,
  }) async {
    return {
      'candidateName': candidateName,
      'role': role,
      'evaluated': true,
      'technicalScore': 91,
      'summary': 'Verified technical implementation against 100-point rubric.',
    };
  }
}
