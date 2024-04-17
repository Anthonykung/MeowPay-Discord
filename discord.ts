/**
* Copyright (c) 2024 Anthony Kung (anth.dev)
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     https://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* @file   discord.ts
* @author Anthony Kung <hi@anth.dev> (anth.dev)
* @date   Created on 04/16/2024 18:52:30
*/

import * as dotenv from 'dotenv';
import { WebSocket } from 'ws';

dotenv.config();

// Import credentials
const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_TOKEN, DISCORD_PUBLIC_KEY } = process.env;

// Discord API version 10 gateway URL
const gatewayUrl = 'wss://gateway.discord.gg/?v=10&encoding=json';

// Lexel Translation API URL
const { NEXTAUTH_URL } = process.env;

// Establish a new WebSocket connection

const globalForDiscord = global as unknown as { discord: WebSocket };

export let discord = globalForDiscord.discord || new WebSocket(gatewayUrl);

if (process.env.NODE_ENV !== 'production') globalForDiscord.discord = discord;

export default discord;

// WebSocket connection open event
discord.on('open', () => {
  console.log('Connected to Discord Gateway');

  // Send identification payload
  discord.send(JSON.stringify({
    op: 2, // OP Code for Identify
    d: {
      token: DISCORD_TOKEN,
      intents: 1 << 10, // GUILD_MESSAGE_REACTIONS
      properties: {
        $os: 'linux',
        $browser: 'awesomeness',
        $device: 'awesomeness'
      }
    }
  }));
});

// WebSocket message event
discord.on('message', (data: string) => {
  const payload = JSON.parse(data);

  console.log('Received payload:', payload);

  switch (payload.op) {
    case 0: // Dispatch (Event)
      const event = payload.t;
      const eventData = payload.d;

      switch (event) {
        case 'MESSAGE_REACTION_ADD':
          const { user_id, message_id, emoji, channel_id, guild_id } = eventData;
          try {
            // Do something
          }
          catch (error) {
            console.error('Error processing reaction:', error);
          }
          break;
        default:
          break;
      }
      break;
    case 7: // Reconnect
      console.log('Reconnecting to Discord Gateway');
      discord.close();
      break;
    case 9: // Invalid Session
      console.log('Invalid Session, re-identifying');
      discord.send(JSON.stringify({
        op: 2, // OP Code for Identify
        d: {
          token: DISCORD_TOKEN,
          intents: 1 << 10, // GUILD_MESSAGE_REACTIONS
          properties: {
            $os: 'linux',
            $browser: 'awesomeness',
            $device: 'awesomeness'
          }
        }
      }));
      break;
    case 10: // Hello
      const interval = payload.d.heartbeat_interval;
      setInterval(() => {
        discord.send(JSON.stringify({ op: 1, d: null }));
      }, interval);
      break;
    case 11: // Heartbeat ACK
      console.log('Heartbeat ACK received');
      break;
    default:
      break;
  }
});

// WebSocket error event
discord.on('error', (error: Error) => {
  console.error('WebSocket error:', error);
});

// WebSocket close event
discord.on('close', () => {
  console.log('Disconnected from Discord Gateway');
  // Reconnect after 5 seconds
  setTimeout(() => {
    discord = new WebSocket(gatewayUrl);
  }, 5000);
});