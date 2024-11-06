import AsyncLock from "async-lock";

import { Room } from "../models/room.js";
import { MsWorkerService } from "./ms-worker.service.js";

const lock = new AsyncLock();

export class RoomService {
  rooms: Map<string, Room> = new Map();

  msWorkerService: MsWorkerService;

  constructor() {
    this.msWorkerService = new MsWorkerService();
  }

  async getRoom(roomName: string): Promise<Room> {
    let room: Room;
    return new Promise((resolve) => {
      lock.acquire(roomName, async () => {
        if (!this.rooms.has(roomName)) {
          const worker = await this.msWorkerService.getNewWorkerOrLessLoaded();
          room = new Room(roomName, worker);
          this.rooms.set(roomName, room);
        } else {
          room = this.rooms.get(roomName)!;
        }
        resolve(room);
      });
    });
  }
}
