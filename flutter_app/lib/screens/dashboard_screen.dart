import 'package:flutter/material.dart';
import '../models/candidate.dart';
import '../services/api_service.dart';
import '../widgets/metric_card.dart';
import '../widgets/candidate_card.dart';
import 'recruiter_copilot_screen.dart';
import 'jobs_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Candidate> _candidates = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCandidates();
  }

  Future<void> _loadCandidates() async {
    final candidates = await ApiService.fetchCandidates();
    if (mounted) {
      setState(() {
        _candidates = candidates;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'HireSphere AI',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 18,
                letterSpacing: -0.5,
              ),
            ),
            Text(
              'Talent Intelligence & Sourcing',
              style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.work_outline),
            tooltip: 'Jobs',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const JobsScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.smart_toy_outlined),
            tooltip: 'Copilot',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const RecruiterCopilotScreen()));
            },
          ),
        ],
        backgroundColor: Colors.white,
        elevation: 0.5,
        foregroundColor: const Color(0xFF0F172A),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : RefreshIndicator(
              onRefresh: _loadCandidates,
              color: const Color(0xFF4F46E5),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Metric Cards Grid
                    GridView.count(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 1.35,
                      children: const [
                        MetricCard(
                          label: 'Active Jobs',
                          value: '24',
                          icon: Icons.work_outline,
                          iconColor: Color(0xFF4F46E5),
                          iconBgColor: Color(0xFFEEF2FF),
                        ),
                        MetricCard(
                          label: 'Candidates Pipeline',
                          value: '1,847',
                          icon: Icons.people_outline,
                          iconColor: Color(0xFF3B82F6),
                          iconBgColor: Color(0xFFEFF6FF),
                        ),
                        MetricCard(
                          label: 'Interviews Scheduled',
                          value: '12',
                          icon: Icons.calendar_today_outlined,
                          iconColor: Color(0xFF10B981),
                          iconBgColor: Color(0xFFECFDF5),
                        ),
                        MetricCard(
                          label: 'Offers Pending',
                          value: '5',
                          icon: Icons.local_offer_outlined,
                          iconColor: Color(0xFFF59E0B),
                          iconBgColor: Color(0xFFFEF3C7),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Section Title
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'AI Candidate Matches',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          '${_candidates.length} Found',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Candidate Cards Grid
                    GridView.builder(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.82,
                      ),
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _candidates.length,
                      itemBuilder: (context, index) {
                        return CandidateCard(candidate: _candidates[index]);
                      },
                    ),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const RecruiterCopilotScreen()));
        },
        backgroundColor: const Color(0xFF0D1F2D),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.smart_toy, size: 18),
        label: const Text('Recruiter Copilot', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
      ),
    );
  }
}
