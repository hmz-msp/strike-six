# Put STRIKE / SIX online for free

You need a free GitHub account and a free Render account. The game can then run at an HTTPS address that friends around the world can open in a PC browser.

## 1. Create your accounts

1. Create an account at https://github.com/signup.
2. Create an account at https://dashboard.render.com/register. Signing in with GitHub is convenient.

Complete any email verification or account checks yourself. Do not share passwords or recovery codes in chat.

## 2. Upload the game to GitHub

1. Extract **StrikeSix.zip** on your computer.
2. In GitHub, choose **New repository**. Name it `strike-six`. A private repository is fine when connected to Render.
3. Upload the extracted game's contents into the repository root. At the top level you should see `package.json`, `server.mjs`, `render.yaml`, `dist`, `scripts` and `tests`.
4. Do not upload a `node_modules` folder. The supplied ZIP excludes it.
5. Commit the upload. The `.openai` folder belongs to the separate browser preview and is excluded from the ZIP; Render does not need it.

If uploading folders in the browser is awkward, GitHub Desktop can create/publish the repository from the extracted folder.

## 3. Create the Render service

1. In Render, select **New → Web Service**.
2. Connect GitHub and select the `strike-six` repository.
3. Choose **Node** as the runtime.
4. Choose a region near the largest number of players. One server cannot have equally low latency to every continent.
5. Use these settings:

| Field | Value |
|---|---|
| Root directory | Leave empty if the game is at the repository root |
| Build command | `npm install --omit=dev && npm run build` |
| Start command | `npm start` |
| Instance type | **Free** |
| Health check path | `/health` |

6. Under Environment, set `ADMIN_PASSWORD` to `pakiboys` and `NODE_VERSION` to `22`. The password also defaults to the requested value when the environment variable is absent.
7. Create the service. Wait for deployment to finish successfully.
8. Open the assigned `https://...onrender.com` address. You should see the game menu.

Alternatively, Render's Blueprint flow can read the included `render.yaml`. Check that it selects the **Free** plan before creating the service.

## 4. Play with friends

1. Everyone opens the same Render game address.
2. The host chooses **Host match**, enters that same address in **Server address**, selects map/mode/weapons and clicks **Create private room**.
3. Click **Copy invitation link** in the match menu and send the link to your friends, or send them the server address and room code.
4. Friends choose **Join friends**, enter the address and room code, and join. Team choices are available for team modes.
5. Everyone clicks **Resume match** to capture their mouse.

Use the Render game address for sharing. A browser preview restricted to its owner cannot be used as a public invitation page.

## 5. Change match settings

Open **Admin panel** from the start screen or pause menu, enter the server address, and use password **pakiboys**. Select the active room. Adjust settings and choose **Apply & restart match**. Only the chosen room is restarted.

## Free hosting limits

- Render free web services currently sleep after 15 minutes without inbound traffic. The next request or WebSocket connection wakes them; this can take about a minute. Open the game address and wait before joining if it has been idle.
- Free services have usage quotas and resource limitations. Availability and terms can change. Keep the service on Free unless you deliberately choose to upgrade.
- WebSockets disconnect when an instance restarts or redeploys. Active rooms and scores are held in memory and are lost on restart. Players must create/rejoin a room.
- This server is designed as a single instance. Do not scale it across multiple instances without adding shared room routing.
- Six-player internet performance still needs real testing. Avoid heavy background downloads while playing.

## If connection fails

- Confirm the address starts with `https://` and points to the running Render service.
- Visit `/health` on that address. A running service returns `{"ok":true,...}`.
- Check that the host and friends use exactly the same server address and room code.
- If a free server is waking, wait about a minute and try again.
- If a room disappeared, its last player left or the server restarted. Create a new room.
- If the mouse will not capture, click **Resume match** again. Use a normal browser tab on a PC with hardware acceleration enabled.

## Can Codex do the deployment?

Yes, with access to the repository and hosting account. The code, build commands and deployment configuration are prepared. After creating your accounts, return to this task and ask to deploy the game to your free Render service. Account signup, verification, sign-in, and any provider-required account checks must be completed by you. No hosting account was created and no paid plan was purchased during this build.

## Official references

Checked 15 September 2026:

- Render free services: https://render.com/docs/free
- Render web services: https://render.com/docs/web-services
- WebSocket hosting: https://render.com/docs/websocket
- First deployment: https://render.com/docs/your-first-deploy
