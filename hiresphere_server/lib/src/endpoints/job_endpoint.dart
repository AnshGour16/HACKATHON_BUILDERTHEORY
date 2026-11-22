import 'package:serverpod/serverpod.dart';

class JobEndpoint extends Endpoint {
  Future<List<Map<String, dynamic>>> listJobs(Session session) async {
    return [
      {
        'id': '1',
        'title': 'Senior Software Engineer',
        'department': 'Software and IT',
        'location': 'Remote',
        'type': 'Full-time',
        'evaluationType': 'TECHNICAL_GITHUB',
        'applicantCount': 24,
      },
      {
        'id': '2',
        'title': 'Growth Marketing Lead',
        'department': 'Marketing',
        'location': 'New York, NY',
        'type': 'Full-time',
        'evaluationType': 'NON_TECHNICAL_ASSIGNMENT',
        'applicantCount': 18,
      },
      {
        'id': '3',
        'title': 'Sales Development Manager',
        'department': 'Sales',
        'location': 'Austin, TX',
        'type': 'Full-time',
        'evaluationType': 'NON_TECHNICAL_ASSIGNMENT',
        'applicantCount': 15,
      },
    ];
  }
}
