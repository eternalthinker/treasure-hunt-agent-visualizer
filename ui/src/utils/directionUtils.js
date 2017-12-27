import * as Direction from '../constants/Direction';

const directionCoordsMap = new Map([
  [Direction.NORTH, {x: 0, y: -1}],
  [Direction.SOUTH, {x: 0, y: 1}],
  [Direction.EAST, {x: 1, y: 0}],
  [Direction.WEST, {x: -1, y: 0}]
]);

export const coordsTowards = (x, y, direction) => {
  const delta = directionCoordsMap.get(direction);
  return {
    x: x + delta.x,
    y: y + delta.y
  };
};
