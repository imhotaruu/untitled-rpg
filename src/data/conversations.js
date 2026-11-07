import { villagePeople } from "./relationships";

const rowan = villagePeople.rowan.name;
const line = (speaker, text) => ({ speaker, text });
const narration = (text) => line("Narration", text);
const scene = (personId, actionId, beats) => ({ personId, actionId, beats });

// Stable scene IDs belong to saves. "player" resolves to the chosen name.
export const conversations = {
  garron_training: scene("garron", "train_with_garron", [
    narration("Your father waits outside the Stonefield house with a wooden training sword in hand."),
    line("Garron", "Before you worry about striking anything, find your footing. A steady stance will serve you better than a strong swing."),
    line("player", "Like this?"),
    narration("Garron adjusts your stance and walks you through the basic movements. Only when your feet are settled does he place the sword in your hands."),
    line("Garron", "There. Take your time getting used to its weight. We can practice the forms together."),
    line("Garron", `When you're ready for a change of pace, head to the village square. ${rowan} made that sword; they'd be glad to meet you.`),
    line("Garron", "Your mother's working at the healer's hut, too. Let her look at any scrapes. If you're simply worn out, come home and rest."),
  ]),
  garron_practice: scene("garron", "practice_with_garron", [
    narration("You follow the forms your father showed you, slowly getting used to the weight of the training sword."),
    line("Garron", "Don't rush to the next movement. Finish this one first."),
    line("player", "One at a time. Alright."),
  ]),
  garron_guard: scene("garron", "practice_with_garron", [
    narration("Garron notices your stance becoming steadier. This time, you hold your ground without his correction."),
    line("Garron", "That's it. Keep your feet under you, and let your guard do its work."),
    line("player", "It feels steadier now."),
    line("Garron", "Good. Remember that feeling. You've learned the basics of guarding."),
  ]),
  garron_armor: scene("garron", "collect_training_armor", [
    narration("Your father watches you settle into your guard, then nods toward a bundle by the door."),
    line("Garron", "You are learning to keep your feet. Now let us keep the bruises down."),
    narration("Inside are a patched cap, a padded vest, leather bracers, and reinforced leggings. None of it is new, but every strap has been checked."),
    line("player", "Thanks, Dad."),
  ]),
  elira_visit: scene("elira", "visit_healer", [
    narration("The healer's hut smells faintly of crushed herbs. Your mother looks up from her work as you step inside."),
    line("Elira", "There you are. Come in, love. How are you getting on?"),
    line("player", "I thought I'd stop by."),
    line("Elira", "You never need an excuse to see me."),
    line("Elira", "Has your father had you practicing already? Let me see those hands. Come to me if you're hurt; that's what this little hut is for."),
    line("player", "And if I'm just tired?"),
    line("Elira", "Then go home and put your feet up. A little rest will bring your strength back. You don't have to do everything in one day."),
  ]),
  elira_care: scene("elira", "visit_healer", [
    narration("Elira makes a place for you to sit and tends carefully to your wounds."),
    line("Elira", "There. Give yourself a little care, too. Being determined doesn't mean you have to ignore what hurts."),
    line("player", "I will. Thanks, Mum."),
  ]),
  elira_well: scene("elira", "visit_healer", [
    line("Elira", "You look well. I'm glad. Stay a moment, if you'd like."),
    narration("For a little while, you sit with your mother as she sorts the herbs beside her."),
  ]),
  rowan_meeting: scene("rowan", "meet_rowan", [
    narration("A carpenter at the square notices your practice sword and brushes shavings from their sleeve."),
    line(rowan, `One of mine. I'm ${rowan}. Garron brings them back with more dents than I thought wood could hold.`),
    line("player", "I'm learning to use one myself."),
    narration("Their smile softens as they turn a split offcut in their hands."),
    line(rowan, "The path out of the village leads to the forest edge. Stay where you feel comfortable; you'll find your bearings in time."),
    line(rowan, "If you find sound fallen wood along the forest trail, I could use a small bundle. Six pieces would do. No hurry—the woods aren't going anywhere."),
  ]),
  rowan_wood: scene("rowan", "bring_rowan_wood", [
    narration(`${rowan} turns each piece of wood in the light, then makes room for you beside the workbench.`),
    line(rowan, "Good grain. You took care choosing these."),
    narration("For a while, they show you how to follow the grain instead of fighting it."),
    line("player", "There's more to choosing a good piece than I thought."),
    narration("When you leave, five coins rest in your palm, and their farewell carries the warmth of someone expecting to see you again."),
  ]),
  rowan_lesson: scene("rowan", "begin_rowan_crafting", [
    narration(`${rowan} clears a space at the workbench.`),
    line(rowan, "You've brought me good wood. Now let's see what you can make of it."),
    narration("They set down a strip of cloth for you."),
    line(rowan, "Four sound pieces of wood, a little patience, and this for the grip. We'll start with a practice sword. Keep it when we're done."),
    line("player", "I'd like to try."),
  ]),
  rowan_finished: scene("rowan", "complete_rowan_crafting", [
    narration(`${rowan} tests the grip, then hands the sword back.`),
    line(rowan, "Not perfectly straight. Neither was my first."),
    line("player", "I'll remember that."),
    narration("They place five coins on the bench."),
    line(rowan, "For seeing it through. Take care of that blade—you'll remember more from using it than from watching me."),
  ]),
};
