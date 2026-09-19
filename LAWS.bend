import Base
import ./game.bend as Game

law on_target_unsaved_is_goal:
  for lane: Game.Lane
  for height: Game.Height
  for saved: Bool
  for on: {Game.on_target(lane, height) == True{} : Bool}
  for unsaved: {saved == False{} : Bool}
  {Game.resolve(lane, height, saved) == Game.OutGoal{} : Game.KickOutcome}

law score_never_exceeds_five:
  for g: Game.Goals
  {Nat.is_le(Game.Goals.to_nat(Game.Goals.inc(g)), 5n) == True{} : Bool}

law not_goal_and_saved:
  for o: Game.KickOutcome
  {Bool.and(Game.is_goal(o), Game.is_saved(o)) == False{} : Bool}

law phase_is_legal:
  for p: Game.Phase
  {Game.phase_ok(p) == True{} : Bool}
