import * as TileType from './TileType';
import * as SpriteFrame from './SpriteFrame';
import TileData from './TileData';
import Tile from '../sprites/Tile';

const tileMap = {
  ' ': TileType.GROUND,
  '~': TileType.WATER,
  '*': TileType.WALL,
  '-': TileType.DOOR,
  'k': TileType.KEY,
  'T': TileType.TREE,
  'd': TileType.DYNAMITE,
  'a': TileType.AXE,
  '$': TileType.TREASURE,
  '^': TileType.PLAYER_N,
  'v': TileType.PLAYER_S,
  '>': TileType.PLAYER_E,
  '<': TileType.PLAYER_W
};

const groundTiles = [
  TileType.GROUND,
  TileType.WATER
];

const wallTiles = [
  TileType.WALL,
  TileType.DOOR
];

const toTreasureMapData = (treasureMapTxt) =>
  treasureMapTxt.split('\n')
    .map((rowTxt) =>
      rowTxt.split('').map((chr) => tileMap[chr])
    )
    .filter((row) => row.length > 0);

const toTileDataGrid = (treasureMapTxt) => {
  const treasureMapData = toTreasureMapData(treasureMapTxt);

  const height = treasureMapData.length;
  const width = treasureMapData[0].length;
  const isTileInGroup = (x, y, tileGroup) => {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      // Out of bounds is assumed to be water
      return tileGroup.includes(TileType.WATER);
    }
    return tileGroup.includes(treasureMapData[y][x]);
  };

  const getTileOrientation = (cell, x, y) => {
    let orientation = {};
    if (wallTiles.includes(cell)) {
      orientation = {
        ...orientation,
        wlinkW: isTileInGroup(x - 1, y, wallTiles),
        wlinkE: isTileInGroup(x + 1, y, wallTiles),
        wlinkN: isTileInGroup(x, y - 1, wallTiles),
        wlinkS: isTileInGroup(x, y + 1, wallTiles)
      };
    }

    if (cell === TileType.WATER) {
      orientation = {
        ...orientation,
        linkW: isTileInGroup(x - 1, y, [TileType.WATER]),
        linkE: isTileInGroup(x + 1, y, [TileType.WATER]),
        linkN: isTileInGroup(x, y - 1, [TileType.WATER]),
        linkS: isTileInGroup(x, y + 1, [TileType.WATER])
      };
    } else {
      orientation = {
        ...orientation,
        linkW: !isTileInGroup(x - 1, y, [TileType.WATER]),
        linkE: !isTileInGroup(x + 1, y, [TileType.WATER]),
        linkN: !isTileInGroup(x, y - 1, [TileType.WATER]),
        linkS: !isTileInGroup(x, y + 1, [TileType.WATER])
      };
    }
    return orientation;
  };

  const getLinkType = (orientation) => {
    const { linkE, linkW, linkN, linkS } = orientation;
    const linkTypes = {
      NONE: !linkN && !linkS && !linkE && !linkW,
      N: linkN && !linkS && !linkE && !linkW,
      S: !linkN && linkS && !linkE && !linkW,
      E: !linkN && !linkS && linkE && !linkW,
      W: !linkN && !linkS && !linkE && linkW,
      EW: !linkN && !linkS && linkE && linkW,
      NS: linkN && linkS && !linkE && !linkW,
      NE: linkN && !linkS && linkE && !linkW,
      NW: linkN && !linkS && !linkE && linkW,
      SE: !linkN && linkS && linkE && !linkW,
      SW: !linkN && linkS && !linkE && linkW,
      SEW: !linkN && linkS && linkE && linkW,
      NEW: linkN && !linkS && linkE && linkW,
      NSE: linkN && linkS && linkE && !linkW,
      NSW: linkN && linkS && !linkE && linkW,
      ALL: linkN && linkS && linkE && linkW
    };

    return Object.keys(linkTypes).filter((key) =>
      linkTypes[key]
    );
  };

  return treasureMapData.map((row, y) =>
    row.map((cell, x) => {
      const orientation = getTileOrientation(cell, x, y);
      const bgLinkType = getLinkType(orientation);
      let fgLinkType = null;
      if (wallTiles.includes(cell)) {
        const { wlinkE, wlinkW, wlinkN, wlinkS } = orientation;
        fgLinkType = getLinkType({
          linkE: wlinkE,
          linkW: wlinkW,
          linkS: wlinkS,
          linkN: wlinkN
        });
      }
      const bgCell = (cell === TileType.WATER)
        ? TileType.WATER : TileType.GROUND;
      const tileBg = new TileData(
        x, y, bgCell, SpriteFrame[`${bgCell}_LINKED_${bgLinkType}`]
      );
      let tileFg = null;
      if (!groundTiles.includes(cell)) {
        const fgFrame = fgLinkType
          ? `${cell}_LINKED_${fgLinkType}` : `${cell}`;
        tileFg = new TileData(
          x, y, cell, SpriteFrame[fgFrame]
        );
      }
      return [tileBg, tileFg];
    })
  );
};

const toTileLayer = (tileDataGrid, layer, tileSize, game) =>
  tileDataGrid.map((row) =>
    row.map((pair) => {
      const tileData = pair[layer];
      if (tileData === null) {
        return null;
      }
      const tile = new Tile({
        x: tileData.x * tileSize,
        y: tileData.y * tileSize,
        asset: 'spriteSheet',
        game: game,
        tileType: tileData.tileType
      });
      tile.frame = tileData.frame;
      return tile;
    })
  );

export const parseMapTxtToTileLayers = (txt, game) => {
  const tileDataGrid = toTileDataGrid(txt);
  const bgLayer = toTileLayer(tileDataGrid, 0, 64, game);
  const fgLayer = toTileLayer(tileDataGrid, 1, 64, game);
  return [bgLayer, fgLayer];
};
