export interface ExperienceWorldState {
  hero: number
  page: number
  compile: number
  artifact: number
  artifactFocus: number
  fieldNotes: number
  activeNote: number
  team: number
  activeMember: number
  pointerX: number
  pointerY: number
  scrollVelocity: number
  pointerEnergy: number
}

const worldState: ExperienceWorldState = {
  hero: 0,
  page: 0,
  compile: 0,
  artifact: 0,
  artifactFocus: 0,
  fieldNotes: 0,
  activeNote: -1,
  team: 0,
  activeMember: 0,
  pointerX: 0,
  pointerY: 0,
  scrollVelocity: 0,
  pointerEnergy: 0,
}

export function readWorldState(): ExperienceWorldState {
  return worldState
}

export function writeWorldState(next: Partial<ExperienceWorldState>): void {
  Object.assign(worldState, next)
}
