class JobListing {
  final String id;
  final String title;
  final String department;
  final String location;
  final String type;
  final String evaluationType;
  final int applicantCount;
  final String status;

  const JobListing({
    required this.id,
    required this.title,
    required this.department,
    required this.location,
    required this.type,
    required this.evaluationType,
    required this.applicantCount,
    required this.status,
  });

  factory JobListing.fromJson(Map<String, dynamic> json) {
    return JobListing(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title'] ?? 'Senior Software Engineer',
      department: json['department'] ?? 'Engineering',
      location: json['location'] ?? 'Remote',
      type: json['type'] ?? 'Full-time',
      evaluationType: json['evaluationType'] ?? 'TECHNICAL_GITHUB',
      applicantCount: json['applicantCount'] ?? 12,
      status: json['status'] ?? 'Active',
    );
  }
}
