import 'package:serverpod/protocol.dart';
import 'package:serverpod/serverpod.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  await pod.start();
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
