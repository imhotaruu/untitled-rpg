function getMaxStatName(stat) {
  return `max${stat.charAt(0).toUpperCase()}${stat.slice(1)}`;
}

export function restoreStat(player, stat, amount) {
  const maxStat = getMaxStatName(stat);

  if (typeof player[stat] !== "number") return;
  if (typeof player[maxStat] !== "number") return;

  player[stat] = Math.min(player[maxStat], player[stat] + amount);
}

export function restoreStats(player, restore = {}) {
  Object.entries(restore).forEach(([stat, amount]) => {
    restoreStat(player, stat, amount);
  });
}

export function canPayStatCost(player, cost = {}) {
  if (cost.hp && player.hp < cost.hp) return false;
  if (cost.mp && player.mp < cost.mp) return false;
  if (cost.stamina && player.stamina < cost.stamina) return false;

  return true;
}

export function payStatCost(player, cost = {}) {
  if (cost.hp) player.hp -= cost.hp;
  if (cost.mp) player.mp -= cost.mp;
  if (cost.stamina) player.stamina -= cost.stamina;
}