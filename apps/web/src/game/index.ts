// Game module entry point
export { GameState } from './state/GameState.js';
export { Renderer } from './renderer/Renderer.js';
export { InputSystem } from './systems/Input.js';
export { AudioSystem } from './systems/Audio.js';
export { createPlayer, updatePlayer, gainTrait, levelUp } from './entities/Player.js';
export { spawnCreature, updateCreature } from './entities/Creature.js';
export { spawnBoss, updateBoss } from './entities/Boss.js';
export { GAME_CONFIG, ZONES, ZONE_DEPTHS, CREATURE_TEMPLATES, TRAITS, getMaxTier, getCurrentZone, seededRandom } from './config.js';
