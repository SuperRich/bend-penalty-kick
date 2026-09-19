import Base
import ./game.bend as Game

# A shot on target (between posts, under the bar) with no save is a Goal.
law on_target_unsaved_is_goal:
  for lane: Game.Lane
  for height: Game.Height
  for saved: Bool
  for on: {Game.on_target(lane, height) == True{} : Bool}
  for unsaved: {saved == False{} : Bool}
  {Game.resolve(lane, height, saved) == Game.OutGoal{} : Game.KickOutcome}

# Best-of-5 score never exceeds 5 per side.
law score_never_exceeds_five:
  for g: Game.Goals
  {Nat.is_le(Game.Goals.to_nat(Game.Goals.inc(g)), 5n) == True{} : Bool}

# A kick cannot be both Goal and Saved.
law not_goal_and_saved:
  for o: Game.KickOutcome
  {Bool.and(Game.is_goal(o), Game.is_saved(o)) == False{} : Bool}

# Kickoff state is always one of the six legal phases.
law phase_is_legal:
  for p: Game.Phase
  {Game.phase_ok(p) == True{} : Bool}
