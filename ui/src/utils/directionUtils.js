import * as Direction from '../constants/Direction';

const directionCoordsMap = new Map([
  [Direction.NORTH, {x: 0, y: -1}],
  [Direction.SOUTH, {x: 0, y: 1}],
  [Direction.EAST, {x: 1, y: 0}],
  [Direction.WEST, {x: -1, y: 0}]
]);

const cwTurnMap = new Map([
  [Direction.NORTH, Direction.EAST],
  [Direction.EAST, Direction.SOUTH],
  [Direction.SOUTH, Direction.WEST],
  [Direction.WEST, Direction.NORTH]
]);

const ccwTurnMap = new Map([
  [Direction.NORTH, Direction.WEST],
  [Direction.WEST, Direction.SOUTH],
  [Direction.SOUTH, Direction.EAST],
  [Direction.EAST, Direction.NORTH]
]);

export const coordsTowards = (x, y, direction) => {
  const delta = directionCoordsMap.get(direction);
  return {
    x: x + delta.x,
    y: y + delta.y
  };
};

export const turnRight = (direction) =>
  cwTurnMap.get(direction);

export const turnLeft = (direction) =>
  ccwTurnMap.get(direction);
