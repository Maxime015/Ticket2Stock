import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Text, View } from "react-native";

import { useColors } from "../../lib/theme";

// Tuiles emoji qui défilent verticalement en boucle (inspiré de l'écran
// d'auth « grocify »), thématisées courses / tickets. Auto-scroll uniquement
// (pas de drag) pour cohabiter avec le ScrollView du formulaire.
const { width } = Dimensions.get("window");
const TILE_SIZE = width * 0.26;
const TILE_MARGIN = 7;
const ITEM_HEIGHT = TILE_SIZE + TILE_MARGIN * 2;

type Item = { emoji: string; color: string };

const ITEMS: Item[] = [
  { emoji: "🍎", color: "#FFD6D6" },
  { emoji: "🥦", color: "#D8F3DC" },
  { emoji: "🥕", color: "#FFE4A3" },
  { emoji: "🍅", color: "#FFC9C9" },
  { emoji: "🧀", color: "#FFF0C9" },
  { emoji: "🥖", color: "#EFD3B5" },
  { emoji: "🍝", color: "#FFE6CC" },
  { emoji: "🥛", color: "#EDF2FB" },
  { emoji: "🍗", color: "#F6D6A8" },
  { emoji: "🐟", color: "#CFE8FF" },
  { emoji: "🥤", color: "#FAD6E0" },
  { emoji: "🧴", color: "#FCE1E4" },
  { emoji: "☕", color: "#E6D3C2" },
  { emoji: "🍇", color: "#E9D8FD" },
  { emoji: "🍓", color: "#FFD6D6" },
  { emoji: "🥑", color: "#D8F3DC" },
  { emoji: "🧺", color: "#FFF1C5" },
  { emoji: "🛒", color: "#DDEDF2" },
  { emoji: "🧾", color: "#EDF2FB" },
  { emoji: "🍞", color: "#EFD3B5" },
  { emoji: "🥚", color: "#FFF0C9" },
  { emoji: "🍌", color: "#FFF3B0" },
  { emoji: "🍋", color: "#FFF3B0" },
  { emoji: "🧅", color: "#F3E8FF" },
  { emoji: "🍿", color: "#FFF0C9" },
  { emoji: "🍪", color: "#EFD3B5" },
  { emoji: "🧁", color: "#FFCFE6" },
  { emoji: "🥗", color: "#D8F3DC" },
];

function Tile({ emoji, color }: Item) {
  return (
    <View
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 22,
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: TILE_MARGIN,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}>
      <Text style={{ fontSize: TILE_SIZE * 0.5 }}>{emoji}</Text>
    </View>
  );
}

function Column({
  items,
  reverse = false,
  duration,
}: {
  items: Item[];
  reverse?: boolean;
  duration: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const data = [...items, ...items];
  const halfHeight = items.length * ITEM_HEIGHT;

  useEffect(() => {
    translateY.setValue(reverse ? -halfHeight : 0);
    const anim = Animated.loop(
      Animated.timing(translateY, {
        toValue: reverse ? 0 : -halfHeight,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [reverse, halfHeight, duration, translateY]);

  return (
    <View style={{ width: TILE_SIZE }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {data.map((item, i) => (
          <Tile key={i} {...item} />
        ))}
      </Animated.View>
    </View>
  );
}

export function TileMarquee({ height = 320 }: { height?: number }) {
  const c = useColors();
  const half = Math.floor(ITEMS.length / 2);
  // Ordres différents par colonne pour éviter l'alignement visuel.
  const col1 = useRef([...ITEMS].sort(() => Math.random() - 0.5)).current;
  const col2 = useRef([...ITEMS].slice().reverse()).current;
  const col3 = useRef([...ITEMS.slice(half), ...ITEMS.slice(0, half)]).current;

  return (
    <View style={{ height, overflow: "hidden" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          height: "100%",
        }}>
        <Column items={col1} duration={28000} />
        <Column items={col2} duration={34000} reverse />
        <Column items={col3} duration={24000} />
      </View>

      {/* Fondus haut/bas pour un raccord doux avec le fond et le panneau. */}
      <LinearGradient
        colors={[c.background, "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", c.background]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 72 }}
        pointerEvents="none"
      />
    </View>
  );
}
