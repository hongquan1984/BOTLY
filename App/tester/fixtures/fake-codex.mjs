process.stdin.resume();
process.stdout.write('{"type":"thread.started","thread_id":"tester-fixture-session"}\n');
process.stdout.write('{"type":"turn.completed"}\n');
process.exitCode = process.argv.includes("--fail") ? 2 : 0;
