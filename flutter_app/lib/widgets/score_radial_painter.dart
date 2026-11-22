import 'dart:math';
import 'package:flutter/material.dart';

class ScoreRadialPainter extends CustomPainter {
  final double score; // 0 to 100

  ScoreRadialPainter({required this.score});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width / 2, size.height / 2) - 8;

    // Background circle track
    final bgPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Active progress arc
    final progressPaint = Paint()
      ..color = score >= 90
          ? const Color(0xFF10B981)
          : (score >= 75 ? const Color(0xFF3B82F6) : const Color(0xFFF59E0B))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;

    const startAngle = -pi / 2;
    final sweepAngle = (score / 100) * 2 * pi;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant ScoreRadialPainter oldDelegate) {
    return oldDelegate.score != score;
  }
}
