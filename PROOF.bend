import Base
import ./LAWS.bend as Laws
import ./game.bend as Game

def Laws.not_goal_and_saved(o):
  match o:
    case Game.OutGoal{}:
      {==}
    case Game.OutSaved{}:
      {==}
    case Game.OutMiss{}:
      {==}

def Laws.phase_is_legal(p):
  match p:
    case Game.PhaseAiming{}:
      {==}
    case Game.PhaseFlight{}:
      {==}
    case Game.PhaseGoal{}:
      {==}
    case Game.PhaseSaved{}:
      {==}
    case Game.PhaseMiss{}:
      {==}
    case Game.PhaseOver{}:
      {==}

def Laws.score_never_exceeds_five(g):
  match g:
    case Game.G0{}:
      {==}
    case Game.G1{}:
      {==}
    case Game.G2{}:
      {==}
    case Game.G3{}:
      {==}
    case Game.G4{}:
      {==}
    case Game.G5{}:
      {==}

def Laws.on_target_unsaved_is_goal(lane, height, saved, on, unsaved):
  e1 = Equal.sym(Bool, saved, False{}, unsaved)
  %e1 : {Game.resolve_go(Game.on_target(lane, height), _) == Game.OutGoal{} : Game.KickOutcome}
  e2 = Equal.sym(Bool, Game.on_target(lane, height), True{}, on)
  %e2 : {Game.resolve_go(_, False{}) == Game.OutGoal{} : Game.KickOutcome}
  {==}
