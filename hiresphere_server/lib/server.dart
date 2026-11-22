import 'dart:io';
import 'package:serverpod/protocol.dart';
import 'package:serverpod/serverpod.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  // Register WebServer routes for root and catch-all
  pod.webServer.addRoute(RootRoute(), '/');
  pod.webServer.addRoute(RootRoute(), '/*');

  await pod.start();
}

class RootRoute extends Route {
  @override
  Future<bool> handleCall(Session session, HttpRequest request) async {
    request.response.headers.contentType =
        ContentType('text', 'html', charset: 'utf-8');

    final indexFile = File('web/index.html');
    if (await indexFile.exists()) {
      final html = await indexFile.readAsString();
      request.response.write(html);
    } else {
      request.response.write('''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HireSphere AI | Serverpod Cloud</title>
</head>
<body style="font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#0f172a;">
  <h1>HireSphere AI</h1>
  <p>Official Serverpod Cloud Backend is online.</p>
</body>
</html>''');
    }

    await request.response.close();
    return true;
  }
}

class Protocol extends SerializationManagerServer {
  @override
  String getModuleName() => 'hiresphere';

  @override
  Table? getTableForType(Type t) => null;

  @override
  List<TableDefinition> getTargetTableDefinitions() => [];

  @override
  Map<String, dynamic> serialize(dynamic object) => {};

  @override
  dynamic deserializeByClassName(Map<String, dynamic> data) => null;
}

class Endpoints extends EndpointDispatch {
  @override
  void initializeEndpoints(Server server) {}
}
