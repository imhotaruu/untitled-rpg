import { getBattleInfoEntries } from "../engine/battleInfoSystem";
import BattleCombatantDetails from "./BattleCombatantDetails";

export default function PartyMemberProfile({ combat, partyMembers, targetId }) {
  const member = getBattleInfoEntries(combat, partyMembers).find((entry) => entry.side === "party" && entry.key === targetId);
  if (!member) return <p>This party member is no longer in the battle.</p>;

  return <div className="party-profile-layout">
    <div className="party-profile-art" role="img" aria-label={`${member.name}'s portrait placeholder`}>
      <span className="portrait-silhouette" aria-hidden="true"><span /></span>
      <span className="party-profile-initial" aria-hidden="true">{member.name.slice(0, 1)}</span>
    </div>
    <BattleCombatantDetails entry={member} />
  </div>;
}
