import { EVENTS, getAllEvents } from "./src/content/events.js";

const assert = (cond, msg) => {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; }
  else console.log("OK  :", msg);
};

const all = getAllEvents();
const era1 = all.filter((e) => (e.requires?.era ?? 1) === 1);
const era2 = all.filter((e) => e.requires?.era === 2);
const era3 = all.filter((e) => e.requires?.era === 3);

assert(all.length === 47, `47 total events (got ${all.length})`);
assert(era1.length === 21, `21 Era 1 events (got ${era1.length}) — 11 original + 10 new`);
assert(era2.length === 14, `14 Era 2 events (got ${era2.length}) — 4 original + 10 new`);
assert(era3.length === 12, `12 Era 3 events (got ${era3.length}) — 2 original + 10 new`);

// Spot-check a few of the new events
const spot = [
  "ashStorm","brokenPottery","packOfRats","windfall","strangerByFire","whisperingDust","bonesInTheSand","distantSinging","emptyGraves","theLastBird",
  "tradingCaravan","bandits","firstFrost","harvestSong","wallInspection","roamingDog","smithApprentice","siloRaid","strangeMerchant","villageMessenger",
  "dreamOfTheStone","fragmentsHum","theCensingMan","mirroredPool","whisperingBlade","omenOfWings","pilgrimReturns","scholarReturns","midnightChant","theWalkingDoubt",
];
for (const id of spot) {
  assert(EVENTS[id], `event ${id} exists`);
  const ev = EVENTS[id];
  assert(typeof ev.flavor === "string" && ev.flavor.length > 0, `${id} has flavor`);
  assert(ev.requires?.era >= 1 && ev.requires?.era <= 3, `${id} era gated`);
  if (ev.choices) {
    assert(ev.choices.length >= 2, `${id} choice event has >= 2 choices`);
  } else {
    assert(ev.onFire?.effects?.log, `${id} fire-and-react has log`);
  }
}

// Alignment-gated events still gate
assert(EVENTS.pilgrimReturns.requires.alignment.good === 5, "pilgrimReturns gated by good 5");
assert(EVENTS.scholarReturns.requires.alignment.evil === 5, "scholarReturns gated by evil 5");

// notHasBuilding / hasBuilding still works on existing
assert(EVENTS.wandererHintHome.requires.notHasBuilding === "home", "wandererHintHome still gated");
assert(EVENTS.harvestSong.requires.hasBuilding === "garden", "harvestSong needs garden");
assert(EVENTS.bandits.requires.hasBuilding === "home", "bandits needs home");
assert(EVENTS.siloRaid.requires.hasBuilding === "silo", "siloRaid needs silo");

console.log("\nAll event content drop smoke tests passed.");
