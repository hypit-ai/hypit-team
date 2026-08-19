/**
 * S9 / S10 终端脚本（蓝图 §3.11）。
 * 命令行逐字取自 README「Quickstart」与 docs/quickstart/run.md；
 * 输出行是这些命令的语义摘要，不伪造具体价格与 build id 之外的运行数据。
 */

export interface TerminalLine {
  kind: 'cmd' | 'out' | 'ok' | 'warn'
  text: string
  delayMs?: number
}

export type TerminalScriptId = 'cli-flow' | 'plan-bill' | 'doctor'

export interface TerminalScript {
  id: TerminalScriptId
  title: string
  lines: TerminalLine[]
}

const cliFlow: TerminalScript = {
  id: 'cli-flow',
  title: 'narratage — author to artifact',
  lines: [
    { kind: 'cmd', text: 'narratage runtime use narratage.runtime.json' },
    { kind: 'ok', text: 'runtime selected · wrote .narratage/runtime' },
    { kind: 'cmd', text: 'narratage check main.svml' },
    { kind: 'ok', text: 'source ok · imports resolved · targets resolved' },
    { kind: 'cmd', text: 'narratage plan build.svrun' },
    { kind: 'out', text: 'plan frozen · operations and needs listed · nothing executed' },
    { kind: 'cmd', text: 'narratage build build.svrun --follow' },
    { kind: 'ok', text: 'build submitted · durable · worker detached' },
    { kind: 'cmd', text: 'narratage status <build-id> --watch' },
    { kind: 'out', text: 'phase changes stream here · interrupt leaves the build running' },
    { kind: 'cmd', text: 'narratage get <build-id> --name final.video --to output/final.mp4' },
    { kind: 'ok', text: 'artifact written · output/final.mp4' },
  ],
}

const planBill: TerminalScript = {
  id: 'plan-bill',
  title: 'narratage plan — the bill before you pay',
  lines: [
    { kind: 'cmd', text: 'narratage plan build.svrun' },
    { kind: 'out', text: 'author  ./main.svml' },
    { kind: 'out', text: 'target  final.video' },
    { kind: 'out', text: '' },
    { kind: 'out', text: 'operations' },
    { kind: 'out', text: '  seedance:TextVideo   take          → kie.talking-film' },
    { kind: 'out', text: '  speech:Spine         speech        → local' },
    { kind: 'out', text: '  whisperx:Alignment   timing        → whisperx.talking-film' },
    { kind: 'out', text: '  media-track:Track    broll         → local' },
    { kind: 'out', text: '  render:Video         final         → hyperframes.talking-film' },
    { kind: 'out', text: '' },
    { kind: 'warn', text: 'nothing has run yet. plan never starts external work.' },
  ],
}

const doctor: TerminalScript = {
  id: 'doctor',
  title: 'narratage doctor — full profile audit',
  lines: [
    { kind: 'cmd', text: 'narratage doctor' },
    { kind: 'ok', text: 'runtime role      @narratage/runtime-local' },
    { kind: 'ok', text: 'artifacts         @narratage/artifact-store-fs' },
    { kind: 'ok', text: 'credentials       @narratage/credential-store-env' },
    { kind: 'ok', text: 'endpoint          kie.talking-film · KIE_API_KEY present' },
    { kind: 'warn', text: 'endpoint          vertex.talking-film · GOOGLE_CLOUD_PROJECT missing' },
    { kind: 'out', text: 'no worker started · no paid request made' },
  ],
}

export const terminals: Record<TerminalScriptId, TerminalScript> = {
  'cli-flow': cliFlow,
  'plan-bill': planBill,
  doctor,
}

/** S9 小字：CLI 覆盖的完整动线。 */
export const cliCommands: string[] = [
  'runtime use',
  'check',
  'plan',
  'build --follow',
  'status --watch',
  'inspect',
  'get',
  'history',
  'queue',
  'doctor',
]
