import Base

# Discrete pitch. X: wide miss | on-frame left/center/right | wide miss.
# Y: over the bar | under the bar.
type Lane is Data:
  WideLeft{}
  Left{}
  Center{}
  Right{}
  WideRight{}

type Height is Data:
  Over{}
  Under{}

type KickOutcome is Data:
  OutGoal{}
  OutSaved{}
  OutMiss{}

type Phase is Data:
  PhaseAiming{}
  PhaseFlight{}
  PhaseGoal{}
  PhaseSaved{}
  PhaseMiss{}
  PhaseOver{}

type Goals is Data:
  G0{}
  G1{}
  G2{}
  G3{}
  G4{}
  G5{}

def on_target_under(lane: Lane) -> Bool:
  match lane:
    case WideLeft{}:
      False{}
    case WideRight{}:
      False{}
    case Left{}:
      True{}
    case Center{}:
      True{}
    case Right{}:
      True{}

def on_target(lane: Lane, height: Height) -> Bool:
  match height:
    case Over{}:
      False{}
    case Under{}:
      on_target_under(lane)

def resolve_go(on: Bool, saved: Bool) -> KickOutcome:
  match on:
    case False{}:
      OutMiss{}
    case True{}:
      match saved:
        case True{}:
          OutSaved{}
        case False{}:
          OutGoal{}

def resolve(lane: Lane, height: Height, saved: Bool) -> KickOutcome:
  resolve_go(on_target(lane, height), saved)

def is_goal(o: KickOutcome) -> Bool:
  match o:
    case OutGoal{}:
      True{}
    case OutSaved{}:
      False{}
    case OutMiss{}:
      False{}

def is_saved(o: KickOutcome) -> Bool:
  match o:
    case OutGoal{}:
      False{}
    case OutSaved{}:
      True{}
    case OutMiss{}:
      False{}

def Goals.to_nat(g: Goals) -> Nat:
  match g:
    case G0{}:
      0n
    case G1{}:
      1n
    case G2{}:
      2n
    case G3{}:
      3n
    case G4{}:
      4n
    case G5{}:
      5n

def Goals.inc(g: Goals) -> Goals:
  match g:
    case G0{}:
      G1{}
    case G1{}:
      G2{}
    case G2{}:
      G3{}
    case G3{}:
      G4{}
    case G4{}:
      G5{}
    case G5{}:
      G5{}

def Goals.apply(g: Goals, o: KickOutcome) -> Goals:
  match o:
    case OutGoal{}:
      Goals.inc(g)
    case OutSaved{}:
      g
    case OutMiss{}:
      g

def phase_ok(p: Phase) -> Bool:
  match p:
    case PhaseAiming{}:
      True{}
    case PhaseFlight{}:
      True{}
    case PhaseGoal{}:
      True{}
    case PhaseSaved{}:
      True{}
    case PhaseMiss{}:
      True{}
    case PhaseOver{}:
      True{}

