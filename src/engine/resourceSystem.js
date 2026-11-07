export function addResource(resources, resourceId, amount) {
  if (!resources[resourceId]) return;

  resources[resourceId].amount += amount;
  resources[resourceId].discovered = true;
}

export function addResources(resources, rewards = {}) {
  Object.entries(rewards).forEach(([resourceId, amount]) => {
    addResource(resources, resourceId, amount);
  });
}

export function hasResource(resources, resourceId, amount) {
  if (!resources[resourceId]) return false;

  return resources[resourceId].amount >= amount;
}

export function canPayResourceCost(resources, cost = {}) {
  return Object.entries(cost).every(([resourceId, amount]) => {
    return hasResource(resources, resourceId, amount);
  });
}

export function payResourceCost(resources, cost = {}) {
  Object.entries(cost).forEach(([resourceId, amount]) => {
    if (!resources[resourceId]) return;

    resources[resourceId].amount -= amount;
  });
}