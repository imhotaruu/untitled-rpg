import { useCallback, useEffect, useState } from "react";
import { processGameTick } from "./engine/tickSystem";

import { actions } from "./data/actions";
import { areas } from "./data/areas";
import { upgrades } from "./data/upgrades";

import { createNewJourney } from "./engine/createGameState";
import { advancePrologue, completeBirthScene, updateBirthIdentity, isInPrologue, performPrologueMove, skipPrologue } from "./engine/prologueSystem";
import PrologueScreen from "./components/PrologueScreen";
import DialogueHistoryProvider from "./components/DialogueHistoryProvider";
import StoryPage from "./components/StoryPage";
import { performAction } from "./engine/actionSystem";
import { finishConversation, getPendingConversation, performConversationAction } from "./engine/conversationSystem";
import ConversationScreen from "./components/ConversationScreen";
import { craftItem, getCraftingBlockReason } from "./engine/craftingSystem";
import { getQuestStatus } from "./engine/questSystem";
import { getAvailablePages } from "./engine/navigationSystem";
import { recipes } from "./data/recipes";
import { getPendingExploration, resolveExplorationEncounter } from "./engine/explorationSystem";
import { dismissCombat, performCombatMove } from "./engine/combatSystem";
import { moveToArea } from "./engine/areaSystem";
import { getKnownLocationGroups } from "./engine/locationSystem";
import { equipItem, unequipSlot } from "./engine/equipmentSystem";
import { consumeInventoryItem } from "./engine/itemSystem";
import { createItemFeedback } from "./utils/itemFeedback";
import { createUpgradeFeedback } from "./utils/upgradeFeedback";
import { createGatheringFeedback } from "./utils/gatheringFeedback";
import { createRelationshipFeedback } from "./utils/relationshipFeedback";
import { getGatheringResourceIds, hasGatheringMastery } from "./engine/gatheringSystem";
import {
  getAvailableActions,
  getAreaById,
  getAreaLabel,
  getDiscoveredResources,
} from "./engine/selectors";
import {
  clearAllSaveSlots,
  clearSaveSlot,
  getSaveSlotSummaries,
  loadGameFromSlot,
  loadLastUsedSave,
  saveGameToSlot,
} from "./engine/saveSystem";
import { purchaseUpgrade } from "./engine/upgradeSystem";

import Topbar from "./components/Topbar";
import MainPage from "./components/MainPage";
import CharacterPage from "./components/CharacterPage";
import RelationshipsPage from "./components/RelationshipsPage";
import CraftingPage from "./components/CraftingPage";
import QuestsPage from "./components/QuestsPage";
import CodexPage from "./components/CodexPage";
import { markJournalEntryRead } from "./engine/journalSystem";
import QuickOverviewSidebar from "./components/QuickOverviewSidebar";
import SaveSlotModal from "./components/SaveSlotModal";
import BattleConfirmModal from "./components/BattleConfirmModal";
import StoryConfirmModal from "./components/StoryConfirmModal";
import CombatScreen from "./components/CombatScreen";
import SettingsModal from "./components/SettingsModal";
import ItemFeedbackPopup from "./components/ItemFeedbackPopup";
import { loadPreferences, normalizePreferences, savePreferences } from "./utils/preferences";

function App() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [preferencesSaved, setPreferencesSaved] = useState(true);
  const reducedMotion = preferences.motion === "reduced";

  function handlePreferencesChange(next) {
    const normalized = normalizePreferences(next);
    setPreferences(normalized);
    setPreferencesSaved(savePreferences(normalized));
  }

  // UI feedback shares an atomic update with gameplay, but is never saved.
  const [session, setSession] = useState(() => ({
    gameState: loadLastUsedSave() || createNewJourney(),
    itemFeedback: null,
    feedbackSequence: 0,
  }));
  const { gameState, itemFeedback } = session;
  const [seenPages, setSeenPages] = useState(() => getAvailablePages(gameState).map((page) => page.id));
  const [enteringChapter, setEnteringChapter] = useState(false);
  const availablePages = getAvailablePages(gameState);
  const revealingPages = availablePages.filter((page) => !seenPages.includes(page.id)).map((page) => page.id);
  const markPageRevealed = useCallback((id) => {
    setSeenPages((current) => current.includes(id) ? current : [...current, id]);
  }, []);
  useEffect(() => {
    if (!enteringChapter) return;
    const timer = setTimeout(() => setEnteringChapter(false), 600);
    return () => clearTimeout(timer);
  }, [enteringChapter]);
  const [replayJourney, setReplayJourney] = useState(null);
  const [storyReaderSession, setStoryReaderSession] = useState(0);
  const journey = replayJourney || gameState;
  const prologueActive = isInPrologue(journey);
  const prologueCombat = prologueActive ? journey.narrative.combat : null;
  const conversation = getPendingConversation(gameState);

  const setGameState = useCallback((update) => {
    setSession((current) => {
      const nextGameState = typeof update === "function"
        ? update(current.gameState)
        : update;
      return nextGameState === current.gameState
        ? current
        : { ...current, gameState: nextGameState };
    });
  }, []);

  const dismissItemFeedback = useCallback((expectedFeedback = null) => {
    setSession((current) => {
      // An old timer must never dismiss a newer interaction's feedback.
      if (expectedFeedback && current.itemFeedback !== expectedFeedback) {
        return current;
      }
      return { ...current, itemFeedback: null };
    });
  }, []);

  const handleJournalRead = useCallback((id) => {
    setGameState((current) => markJournalEntryRead(current, id));
  }, [setGameState]);

  const [activeModal, setActiveModal] = useState(null);
  const [saveSlots, setSaveSlots] = useState(() => getSaveSlotSummaries());
  const [activePage, setActivePage] = useState("main");
  const [characterTab, setCharacterTab] = useState("overview");
  const [pendingBattleId, setPendingBattleId] = useState(null);
  const [pendingStoryId, setPendingStoryId] = useState(null);
  const [focusActionId, setFocusActionId] = useState(null);
  const pendingBattle = actions.find((action) => action.id === pendingBattleId);
  const pendingStory = actions.find((action) => action.id === pendingStoryId);

  const { player, resources, actionLog, storyLog, unlocks } = gameState;

  const currentArea = getAreaById(areas, player.area);
  const currentAreaLabel = getAreaLabel(areas, player.area);
  const knownLocationGroups = getKnownLocationGroups(gameState);
  const availableActions = getAvailableActions(actions, player.area, unlocks);
  const discoveredResources = getDiscoveredResources(resources);

  useEffect(() => {
    if (replayJourney) return;
    let lastTime = Date.now();

    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      setGameState((currentState) =>
        processGameTick(currentState, deltaSeconds)
      );
    }, 100);

    return () => clearInterval(intervalId);
  }, [setGameState, replayJourney]);

  function updateJourney(update) {
    if (replayJourney) setReplayJourney(update);
    else setGameState(update);
  }

  function handlePrologueAdvance(sceneId) {
    if (replayJourney && sceneId === "chapter") { setReplayJourney(null); return; }
    if (sceneId === "chapter") {
      setActivePage("main");
      setEnteringChapter(!reducedMotion);
    }
    updateJourney((current) => advancePrologue(current, sceneId));
  }

  function handlePrologueOptions(type) {
    // Replays never save their temporary character over an adventure slot.
    if (replayJourney && type !== "settings") return;
    openModal(type);
  }

  function addSystemLog(currentState, message) {
    return {
      ...currentState,
      actionLog: [message, ...currentState.actionLog].slice(0, 50),
    };
  }

  function refreshSaveSlots() {
    setSaveSlots(getSaveSlotSummaries());
  }

  function openModal(modalType) {
    setPendingStoryId(null);
    setPendingBattleId(null);
    dismissItemFeedback();
    if (modalType !== "settings") refreshSaveSlots();
    setActiveModal(modalType);
  }

  function closeModal() {
    setActiveModal(null);
  }

  function handlePurchaseUpgrade(upgrade) {
    setSession((current) => {
      const before = current.gameState;
      const after = purchaseUpgrade(before, upgrade);
      const feedbackSequence = current.feedbackSequence + 1;
      return {
        gameState: after,
        feedbackSequence,
        itemFeedback: { ...createUpgradeFeedback(before, after, upgrade.id), id: feedbackSequence },
      };
    });
  }

  function handleEquipItem(itemId, preferredSlotId = null) {
    handleItemInteraction("equip", itemId, preferredSlotId);
  }

  function handleUnequipSlot(slotId) {
    handleItemInteraction("unequip", null, slotId);
  }

  function handleUseItem(itemId) {
    handleItemInteraction("use", itemId);
  }

  function handleItemInteraction(type, itemId, slotId = null) {
    setSession((current) => {
      const before = current.gameState;
      const after = type === "use"
        ? consumeInventoryItem(before, itemId)
        : type === "equip"
          ? equipItem(before, itemId, slotId)
          : unequipSlot(before, slotId);
      const feedbackSequence = current.feedbackSequence + 1;

      return {
        gameState: after,
        feedbackSequence,
        itemFeedback: {
          ...createItemFeedback(before, after, { type, itemId, slotId }),
          id: feedbackSequence,
        },
      };
    });
  }

  function handleChangePage(page) {
    if (!availablePages.some((entry) => entry.id === page)) return;
    if (gameState.conversation) return;
    if (gameState.combat && page !== "main") return;
    setPendingStoryId(null);
    dismissItemFeedback();
    setFocusActionId(null);
    setActivePage(page);
  }

  function handleMoveToArea(area) {
    setPendingStoryId(null);
    dismissItemFeedback();
    setFocusActionId(null);
    setGameState((currentState) => moveToArea(currentState, area));
  }

  function handleAction(action) {
    if (gameState.exploration?.pending || gameState.conversation) return;
    if (action.encounterId) {
      dismissItemFeedback();
      setPendingBattleId(action.id);
      return;
    }
    if (action.category === "story" && preferences.confirmStoryActions) {
      dismissItemFeedback();
      setPendingStoryId(action.id);
      return;
    }
    executeAction(action);
  }

  function handleConfirmStory() {
    if (!pendingStory) return;
    setPendingStoryId(null);
    executeAction(pendingStory);
  }

  function executeAction(action) {
    const criticalRolls = Object.fromEntries(getGatheringResourceIds(action).map((id) => [id, Math.random()]));
    const encounterRoll = Math.random();
    setSession((current) => {
      const after = performConversationAction(current.gameState, action, { criticalRolls, encounterRoll });
      const questBefore = getQuestStatus(current.gameState, "rowan_first_craft");
      const questAfter = getQuestStatus(after, "rowan_first_craft");
      const questFeedback = questBefore !== questAfter && ["active", "completed"].includes(questAfter) ? {
        tone: "success", title: questAfter === "active" ? "Quest Accepted" : "Quest Completed", itemLabel: "A Shape of Your Own",
        messages: questAfter === "active" ? ["Received 1 Cloth. Crafting is now available.", "Track your lesson in Quests."] : ["Received 5 Gold. Your handmade sword is yours to keep."], duration: 7000,
      } : null;
      const feedback = questFeedback || createGatheringFeedback(current.gameState, after, action)
        || createRelationshipFeedback(current.gameState, after);
      if (!feedback) return { ...current, gameState: after, itemFeedback: after.conversation ? null : current.itemFeedback };
      const feedbackSequence = current.feedbackSequence + 1;
      return { gameState: after, feedbackSequence, itemFeedback: { ...feedback, id: feedbackSequence } };
    });
  }

  function handleCraft(recipeId) {
    setSession((current) => {
      const before = current.gameState;
      const reason = getCraftingBlockReason(before, recipeId);
      const after = craftItem(before, recipeId);
      const recipe = recipes.find((entry) => entry.id === recipeId);
      const feedbackSequence = current.feedbackSequence + 1;
      return { gameState: after, feedbackSequence, itemFeedback: { id: feedbackSequence,
        tone: reason ? "info" : "success", title: reason ? "Cannot Craft" : "Item Crafted", itemLabel: recipe?.label || "Crafting",
        messages: reason ? [reason, "No materials were spent."] : ["Added to Character → Items.", "Show your work to Rowan to finish the quest."], duration: 7000 } };
    });
  }

  function handleEncounterChoice(token, choiceId) {
    setFocusActionId(gameState.player.area === "forest_trail" ? "explore_forest_trail" : "explore_forest_edge");
    setSession((current) => {
      const encounter = getPendingExploration(current.gameState);
      const after = resolveExplorationEncounter(current.gameState, token, choiceId);
      if (after === current.gameState) return current;
      const choice = encounter.choices.find((entry) => entry.id === choiceId);
      const rewards = Object.entries(choice.rewards || {}).map(([id, amount]) => `+${amount} ${after.resources[id].label}`);
      const feedbackSequence = current.feedbackSequence + 1;
      return { gameState: after, feedbackSequence, itemFeedback: { id: feedbackSequence,
        tone: "success", title: "Encounter Resolved", itemLabel: encounter.title,
        messages: rewards.length ? rewards : [choice.text], duration: 7000 } };
    });
  }

  function handleConfirmBattle() {
    if (!pendingBattle) return;
    const seed = Date.now();
    setGameState((currentState) => performAction(currentState, pendingBattle, { seed }));
    setPendingBattleId(null);
    setFocusActionId(null);
  }

  function handleCombatMove(moveId) {
    setGameState((currentState) => performCombatMove(currentState, moveId));
  }

  function handleDismissCombat() {
    setFocusActionId(actions.find((action) => action.encounterId === gameState.combat?.encounterId)?.id || null);
    setActivePage("main");
    setGameState(dismissCombat);
  }

  function handleFinishConversation(token) {
    setFocusActionId(conversation?.actionId || null);
    setActivePage("main");
    setGameState((current) => finishConversation(current, token));
  }

  function handleSaveToSlot(slotId) {
    const nextState = addSystemLog(gameState, `Game saved to Slot ${slotId}.`);

    saveGameToSlot(slotId, nextState);
    setGameState(nextState);
    refreshSaveSlots();
    closeModal();
  }

  function handleLoadFromSlot(slotId) {
    setPendingStoryId(null);
    const savedState = loadGameFromSlot(slotId);

    if (!savedState) {
      setGameState((currentState) =>
        addSystemLog(currentState, `Slot ${slotId} is empty.`)
      );

      return;
    }

    setGameState(addSystemLog(savedState, `Loaded Slot ${slotId}.`));
    setSeenPages(getAvailablePages(savedState).map((page) => page.id));
    setEnteringChapter(false);
    setStoryReaderSession((current) => current + 1);
    setReplayJourney(null);
    if (characterTab === "mastery" && !hasGatheringMastery(savedState)) setCharacterTab("overview");
    setFocusActionId(null);
    setPendingBattleId(null);
    if (savedState.combat || savedState.conversation || savedState.exploration?.pending || isInPrologue(savedState)
      || !getAvailablePages(savedState).some((page) => page.id === activePage)) setActivePage("main");
    refreshSaveSlots();
    closeModal();
  }

  function handleDeleteSlot(slotId) {
    clearSaveSlot(slotId);
    refreshSaveSlots();

    setGameState((currentState) =>
      addSystemLog(currentState, `Deleted Slot ${slotId}.`)
    );
  }

  function handleResetCurrentGame() {
    setStoryReaderSession((current) => current + 1);
    setPendingStoryId(null);
    setFocusActionId(null);
    setPendingBattleId(null);
    const resetState = createNewJourney();
    setSeenPages(getAvailablePages(resetState).map((page) => page.id));
    setEnteringChapter(false);
    setReplayJourney(null);

    setActivePage("main");
    setCharacterTab("overview");
    setGameState(addSystemLog(resetState, "Current game reset."));
    closeModal();
  }

  function handleDeleteAllSaves() {
    setStoryReaderSession((current) => current + 1);
    setPendingStoryId(null);
    setFocusActionId(null);
    setPendingBattleId(null);
    clearAllSaveSlots();

    const resetState = createNewJourney();
    setSeenPages(getAvailablePages(resetState).map((page) => page.id));
    setEnteringChapter(false);
    setReplayJourney(null);

    setActivePage("main");
    setCharacterTab("overview");
    setGameState(addSystemLog(resetState, "All save slots deleted."));
    refreshSaveSlots();
    closeModal();
  }

  return (
    <DialogueHistoryProvider key={`dialogue-${Boolean(replayJourney)}-${storyReaderSession}`}
      storySummaries={!replayJourney ? conversation?.storySummaries : undefined}
      storyEntries={!prologueActive && !replayJourney ? storyLog : undefined}>
    <div className={conversation && !prologueActive ? "app app-conversation" : gameState.combat || prologueCombat ? "app app-combat" : prologueActive ? "app app-prologue" : "app"}
      data-reduced-motion={reducedMotion} data-entering-chapter={enteringChapter && !reducedMotion}
      onAnimationEnd={(event) => { if (event.target === event.currentTarget && event.animationName === "chapter-game-arrive") setEnteringChapter(false); }}>
      {prologueActive ? prologueCombat ? <CombatScreen key={`prologue-${Boolean(replayJourney)}-${storyReaderSession}`}
        paused={Boolean(activeModal)}
        combat={prologueCombat} areaLabel="The Veil" combatPace={preferences.combatPace} reducedMotion={reducedMotion}
        textSpeed={preferences.textSpeed}
        onMove={(moveId) => updateJourney((current) => performPrologueMove(current, moveId))}
        onDismiss={() => handlePrologueAdvance("battle")} onOpenModal={handlePrologueOptions}
        onSkipPrologue={() => updateJourney(skipPrologue)}
        replay={Boolean(replayJourney)} onExitReplay={() => setReplayJourney(null)} />
        : <PrologueScreen key={`${Boolean(replayJourney)}-${journey.narrative.sceneId}-${storyReaderSession}`}
          paused={Boolean(activeModal)}
          narrative={journey.narrative} replay={Boolean(replayJourney)} reducedMotion={reducedMotion}
          textSpeed={preferences.textSpeed}
          onIdentityChange={(identity) => updateJourney((current) => updateBirthIdentity(current, identity))}
          onCompleteBirth={(identity) => updateJourney((current) => completeBirthScene(current, identity))}
          onAdvance={handlePrologueAdvance} onSkip={() => updateJourney(skipPrologue)}
          onExit={() => setReplayJourney(null)} onOpenModal={handlePrologueOptions} />
        : conversation ? <ConversationScreen key={`conversation-${conversation.token}-${storyReaderSession}`}
          conversation={conversation} areaLabel={currentAreaLabel} onFinish={handleFinishConversation}
          onOpenModal={openModal} paused={Boolean(activeModal)} textSpeed={preferences.textSpeed} reducedMotion={reducedMotion} />
        : gameState.combat ? <CombatScreen
        combatPace={preferences.combatPace}
        textSpeed={preferences.textSpeed}
        reducedMotion={reducedMotion}
        magicUnlocked={Boolean(gameState.unlocks?.systems?.magic)}
        inventory={gameState.inventory}
        combat={gameState.combat}
        areaLabel={currentAreaLabel}
        onMove={handleCombatMove}
        onDismiss={handleDismissCombat}
        onOpenModal={openModal}
      /> : <>
      <Topbar key={`navigation-${storyReaderSession}`}
        availablePages={availablePages} revealingPages={revealingPages} onReveal={markPageRevealed} reducedMotion={reducedMotion}
        activePage={activePage}
        currentAreaLabel={currentAreaLabel}
        player={player}
        onChangePage={handleChangePage}
        onOpenModal={openModal}
      />

      <main
        className={
          ["relationships", "crafting", "quests", "story", "codex"].includes(activePage)
            ? "game-layout full-page-layout"
            : activePage !== "main"
            ? "game-layout character-layout"
            : "game-layout main-layout"
        }
      >
        {activePage === "main" ? (
          <>
            <MainPage
              explorationEncounter={getPendingExploration(gameState)}
              onEncounterChoice={handleEncounterChoice}
              gatheringMastery={gameState.gatheringMastery}
              focusActionId={focusActionId}
              player={player}
              resources={resources}
              actionLog={actionLog}
              storyLog={storyLog}
              currentArea={currentArea}
              currentAreaLabel={currentAreaLabel}
              knownLocationGroups={knownLocationGroups}
              availableActions={availableActions}
              onMoveToArea={handleMoveToArea}
              onAction={handleAction}
            />

          </>
        ) : activePage === "story" ? (
          <StoryPage onReplay={() => { dismissItemFeedback(); setReplayJourney(createNewJourney()); }} />
        ) : activePage === "relationships" ? (
          <RelationshipsPage gameState={gameState} />
        ) : activePage === "crafting" ? (
          <CraftingPage gameState={gameState} onCraft={handleCraft} onOpenItems={() => { setCharacterTab("items"); handleChangePage("character"); }} />
        ) : activePage === "quests" ? (
          <QuestsPage gameState={gameState} onChangePage={handleChangePage} />
        ) : activePage === "codex" ? (
          <CodexPage key={`journal-${storyReaderSession}`} gameState={gameState} onRead={handleJournalRead} />
        ) : (
          <CharacterPage
            player={player}
            resources={resources}
            gameState={gameState}
            currentAreaLabel={currentAreaLabel}
            upgrades={upgrades}
            activeTab={characterTab}
            onChangeTab={setCharacterTab}
            onPurchaseUpgrade={handlePurchaseUpgrade}
            onEquipItem={handleEquipItem}
            onUnequipSlot={handleUnequipSlot}
            onUseItem={handleUseItem}
          />
        )}
        {["main", "character"].includes(activePage) && <QuickOverviewSidebar
          player={player}
          resources={resources}
          discoveredResources={discoveredResources}
        />}
      </main>
      </>}

      <ItemFeedbackPopup feedback={conversation ? null : itemFeedback} onDismiss={dismissItemFeedback} />

      {pendingStory && !gameState.combat && <StoryConfirmModal key={pendingStory.id}
        action={pendingStory} onConfirm={handleConfirmStory} onCancel={() => setPendingStoryId(null)} />}

      {pendingBattle && !gameState.combat && <BattleConfirmModal
        action={pendingBattle}
        onConfirm={handleConfirmBattle}
        onCancel={() => setPendingBattleId(null)}
      />}

      {activeModal === "settings" && <SettingsModal
        preferences={preferences}
        saved={preferencesSaved}
        onChange={handlePreferencesChange}
        onClose={closeModal}
      />}

      {activeModal && activeModal !== "settings" && (
        <SaveSlotModal
          mode={activeModal}
          slots={saveSlots}
          onClose={closeModal}
          onSave={handleSaveToSlot}
          onLoad={handleLoadFromSlot}
          onDeleteSlot={handleDeleteSlot}
          onResetCurrentGame={handleResetCurrentGame}
          onDeleteAllSaves={handleDeleteAllSaves}
        />
      )}
    </div>
    </DialogueHistoryProvider>
  );
}

export default App;
