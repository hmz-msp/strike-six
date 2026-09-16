# STRIKE / SIX

A playable browser FPS for PC, keyboard and mouse. Original low-poly graphics and three original arenas, with CS-style input, gun categories and HUD conventions.

## Play on your computer

1. Install Node.js 22 or newer from https://nodejs.org.
2. Extract the game ZIP into a folder.
3. Double-click **Start-Game.cmd** on Windows. It installs the two required libraries on first launch.
4. Open **http://localhost:3000** in Edge or Chrome.
5. Choose **Practice**, a map, a mode and a bot count. Enter practice, then click **Resume match** to capture the mouse.

Keep the server window open while playing. Press Ctrl+C in that window to stop it.

On other operating systems, run `npm install`, `npm run build`, then `npm start` in the game folder.

## Included

- **Modes:** 1v1, 1v1v1, 1v1v1v1, 2v2, 2v1 and deathmatch. Mode limits are enforced by the server. No room accepts more than six players.
- **Maps:** Citadel (courtyards), Foundry (industrial lanes), Harbor (containers).
- **Weapons:** 34 guns across rifles, sniper rifles, pistols, SMGs, shotguns and machine guns; plus knife, HE grenade, flashbang, smoke, Molotov and decoy. Every mode allows any primary gun, pistol and chosen utility. Press B to change your loadout; guns have different damage, accuracy, firing rates, magazines and reload times.
- **Gunplay:** perfect crosshair-aligned hitscan shots, headshots, armor, magazine/reload timing, basic scoped zoom, wall collision, weapon drop/pickup, switching and inspect motion.
- **Movement:** walking, running, crouching, jumping and acceleration.
- **1v1:** every enemy kill restores the killer's health. Victims respawn at a randomly selected point, avoiding their previous spawn where possible. Spawn protection ends when firing.
- **Matches:** respawn skirmishes. Reach the kill target or have the most kills when time runs out. Team modes total teammates' kills. Defaults: 20 kills, 10 minutes, two-second respawn.
- **Practice:** local bots or an empty map, with no account or online server required.
- **HUD:** health, armor, weapon/ammo, scope, radar, kill feed, timer, score target, scoreboard and ping. Radar shows self and teammates.
- **Preferences:** sensitivity, scoped multiplier, volume and graphics quality. Settings → Crosshair provides a live preview with cross/T/dot styles, color, line length, thickness, gap, opacity, center dot, outline and movement/firing expansion. Settings → Keyboard remaps 18 actions; conflicting keys swap automatically. Preferences and bindings save on the current device, with separate reset buttons. Mouse aim/fire/scope and Escape remain fixed.
- **Loadout sketches:** weapon selection shows 2D side-view line sketches projected from the existing in-game models.
- **AWP:** one armored torso shot kills at normal 100 HP over arena distances. Leg shots are weaker; other snipers retain their own damage. Custom health and spawn protection still apply.
- **Perfect aim:** every gun fires along the center of the crosshair, including unscoped snipers and every shotgun pellet. Running, jumping, crouching, range and sustained fire introduce no aim deviation. Gun kick and optional crosshair animation are visual only. Damage falloff, armor, walls, ammunition and firing/reload timing still apply.
- **Firing input:** shooting no longer requests mouse capture again or clears held movement keys.
- **Admin:** room settings, map/mode changes, restart, player removal, friendly fire, headshots-only, health, armor, movement speed, respawn delay and protection. Password: **pakiboys**.

## Make it online for free

The simplest deployment hosts **both the browser game and multiplayer server on Render**. You do not need a separate frontend host or a purchased domain. See [ONLINE-SETUP.md](ONLINE-SETUP.md) for the full walkthrough.

After hosting, share the Render game URL. The host creates a room; friends enter that same server URL and the six-character room code. **Copy invitation link** fills those fields automatically. In 2v2 and 2v1, joiners can request a team; full teams are refused. Rooms end when the last player leaves, and all active rooms reset if the server restarts.

If you are using the separately published browser preview, enter the Render server URL under Host match / Join friends. Practice works on that preview before a multiplayer server exists. A private preview link is not a substitute for the public Render game URL when inviting friends.

## Admin panel

Open **Admin panel**, enter the running server's address and **pakiboys**, then choose an active room. You can also open Admin panel from the in-game pause menu. Applying settings restarts that room and resets scores. A smaller mode cannot be selected while too many players remain; remove players first. Admin login is checked on the server and rate-limited. The browser keeps its admin session in memory for up to one hour.

Settings affect active rooms and reset when those rooms are removed or the server restarts. This version does not persist server configuration or player accounts.

## Controls

These are the default bindings. Customize keyboard actions in Settings → Keyboard; the in-game Controls panel and hints reflect your choices.

| Action | Input |
|---|---|
| Move | W A S D |
| Aim / fire | Mouse / left click |
| Scope | Right click with a scoped gun |
| Walk / crouch | Shift / Ctrl |
| Jump | Space |
| Reload / inspect | R / F |
| Primary / pistol / knife / utility | 1 / 2 / 3 / 4 |
| Previous / cycle weapon | Q / mouse wheel |
| Drop / pick up | G / E |
| Arsenal | B |
| Scoreboard / pause menu | Tab / Esc |

Sensitivity uses `sensitivity × 0.022°` per mouse input unit. Browser input and device settings can differ from native CS:GO. Right-click is scope for supported guns; native CS alternate firing modes are not all implemented.

## Fidelity and release status

This is an independently built, playable first release. **It is not an exact CS:GO recreation or a production-quality replacement.** It uses original low-poly models, procedural materials, simple sound synthesis and simplified animation. Movement constants, weapon statistics and grenade behavior are custom approximations, not measured reproductions of Valve's game. Decoys have a visual effect; they do not yet emulate convincing weapon sounds. Some weapon-specific secondary mechanics, bullet penetration, exact recoil patterns, high-end character/weapon art and competitive lag compensation are not included. Current matches are respawn skirmishes, not bomb-defusal or elimination rounds.

Worldwide play is supported by the server architecture, but requires an actual hosted server and has **not** been tested with geographically separated players. A free service's location and load affect latency. The server uses a 60 Hz simulation and 20 Hz snapshots with client prediction and remote-player smoothing. It validates movement, damage, ammunition, room capacity and admin actions. It does not provide tournament-grade anti-cheat.

The project needs real matches with your friends and further art/animation, tuning and network playtesting before it meets a commercial “fully polished” bar. No claim of exact CS:GO fidelity is made.

## Validation

Run `npm test` for the gameplay and real WebSocket integration checks. Verified checks cover all mode capacities, team balance/selection, collision-free spawns, 1v1 healing/random respawns, friendly fire, cover blocking shots, firing/reload timing, movement, weapon choice, score resets, admin validation, grenades, drop/pickup and six simultaneously connected clients. Browser checks covered practice, mouse capture, a shot changing ammo, arsenal, sensitivity persistence, creating/joining a room, scoreboard, admin login and live map change. Browser checks produced no uncaught JavaScript errors.

## Project contents

- `dist/`: ready browser assets and shared game rules.
- `server.mjs`: HTTP/WebSocket server and admin API.
- `tests/`: executable gameplay/network tests.
- `render.yaml`: free Render deployment configuration.
- `Start-Game.cmd`: Windows launcher.
- `scripts/build.mjs`: copies the installed Three.js runtime into browser assets.

Third-party libraries retain their own licenses; see THIRD-PARTY-NOTICES.md. No Valve code, models, maps, textures or sounds are distributed.

The current Sites publication serves the browser game and local practice. A separately hosted multiplayer server must also run the updated source to receive gameplay-rule changes.

## Latest update

- Overhead health bars and numbers are removed. Player avatars now have stylized female faces, hair, fitted tactical uniforms, articulated limb movement and smoother turning.
- Muzzle flash animation and visual gun recoil are improved; perfect crosshair accuracy is unchanged.
- Practice setup offers Easy, Medium and Hard bot difficulty, saved on this browser. Difficulty changes reaction delay, tracking and firing bursts.
- Eliminations show a confirmation with the opponent's name.
- Weapon selection uses a colored illustration atlas instead of wireframe previews. Illustrations are stylized inventory art.
- To drive: include the DB12-inspired spy car in your loadout, equip it, then open the match menu (Escape) and select Drive car. Resume to drive. Forward/back accelerate/reverse; left/right steer using your saved movement bindings. Open the match menu and choose Exit car to return to walking. Entering requires open ground. Space or left mouse fires the mounted guns. Cars have 200 HP; four separate 50-damage impacts destroy a car, while two eliminate a player on foot.
- Car impacts remove half the configured maximum health, bypassing armor. Two separate impacts kill a full-health player. Continuous overlap counts once. Spawn protection and friendly-fire rules still apply.

The updated multiplayer server source is included; redeploy it alongside the browser assets to enable the car online.

Car driving update: smooth acceleration, braking with the walk key (Shift by default), slower reverse with reversed steering, no stationary spinning, solid corner collisions, and a third-person chase camera with an overhead fallback near walls. The HUD shows speed while driving; the loadout includes a new car illustration.

Visual update: silver DB12-inspired spy coupe, detailed first-person AK-47 and weapon surfaces, and athletic female avatars in tactical crop tops and shorts. Existing maps, aim, hitboxes and animation rig are preserved.
