import { useMemo, useState } from "react";

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/theme";
import { useOnboarding } from "../../context/OnboardingContext";

type Range = "Week" | "Month";

type CalorieEntry = {
  date: string;
  calories: number;
};

type ChartDay = {
  key: string;
  label: string;
  calories: number | null;
};

/*
 * ============================================
 * CALORIE HISTORY
 * ============================================
 *
 * Put ONLY real recorded calorie data here.
 *
 * Example:
 *
 * {
 *   date: "2026-10-01",
 *   calories: 1830,
 * }
 *
 * Days that are NOT present in this array
 * automatically remain blank in the graph.
 *
 * Later, this should come from your backend /
 * shared meal-history state instead.
 */
const CALORIE_HISTORY: CalorieEntry[] = [];

/*
 * ============================================
 * DATE HELPERS
 * ============================================
 */

function toDateKey(date: Date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonday(
  date: Date
) {
  const result =
    new Date(date);

  const day =
    result.getDay();

  /*
   * Sunday = 0
   * Monday = 1
   */
  const difference =
    day === 0
      ? -6
      : 1 - day;

  result.setDate(
    result.getDate() +
      difference
  );

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

function buildWeekData(
  history: CalorieEntry[]
): ChartDay[] {
  const today =
    new Date();

  const monday =
    getMonday(today);

  const labels = [
    "M",
    "T",
    "W",
    "T",
    "F",
    "S",
    "S",
  ];

  return labels.map(
    (label, index) => {
      const date =
        new Date(monday);

      date.setDate(
        monday.getDate() +
          index
      );

      const key =
        toDateKey(date);

      const entry =
        history.find(
          (item) =>
            item.date === key
        );

      return {
        key,
        label,
        calories:
          entry?.calories ??
          null,
      };
    }
  );
}

function buildMonthData(
  history: CalorieEntry[]
): ChartDay[] {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    today.getMonth();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  return Array.from(
    {
      length:
        daysInMonth,
    },
    (_, index) => {
      const day =
        index + 1;

      const date =
        new Date(
          year,
          month,
          day
        );

      const key =
        toDateKey(date);

      const entry =
        history.find(
          (item) =>
            item.date === key
        );

      return {
        key,

        /*
         * Showing every date under 31 bars
         * becomes crowded.
         *
         * Labels are shown every 5 days,
         * plus day 1.
         */
        label:
          day === 1 ||
          day % 5 === 0 ||
          day ===
            daysInMonth
            ? String(day)
            : "",

        calories:
          entry?.calories ??
          null,
      };
    }
  );
}

/*
 * ============================================
 * SCREEN
 * ============================================
 */

export default function ProgressScreen() {
  const { profile } =
    useOnboarding();

  const [range, setRange] =
    useState<Range>(
      "Week"
    );

  const calorieGoal =
    profile.calorieGoal ??
    2150;

  /*
   * Later you can replace
   * CALORIE_HISTORY with data
   * returned from your backend.
   */
  const history =
    CALORIE_HISTORY;

  const chartData =
    useMemo(() => {
      if (
        range === "Week"
      ) {
        return buildWeekData(
          history
        );
      }

      return buildMonthData(
        history
      );
    }, [
      range,
      history,
    ]);

  /*
   * Only count days that
   * actually contain data.
   *
   * Blank days do NOT count
   * toward the average.
   */
  const recordedValues =
    chartData
      .filter(
        (day) =>
          day.calories !==
          null
      )
      .map(
        (day) =>
          day.calories as number
      );

  const totalCalories =
    recordedValues.reduce(
      (
        total,
        value
      ) =>
        total + value,
      0
    );

  const averageCalories =
    recordedValues.length > 0
      ? Math.round(
          totalCalories /
            recordedValues.length
        )
      : 0;

  const daysLogged =
    recordedValues.length;

  /*
   * Make chart tall enough for either
   * actual calories or calorie goal.
   */
  const highestValue =
    Math.max(
      calorieGoal,
      ...recordedValues,
      1
    );

  /*
   * Give bars a little headroom so they
   * don't hit the top of the chart.
   */
  const chartMaximum =
    Math.ceil(
      highestValue *
        1.15
    );

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ================================= */}
        {/* HEADER                            */}
        {/* ================================= */}

        <View
          style={
            styles.header
          }
        >
          <Brand />

          <View
            style={
              styles.calendarIcon
            }
          >
            <Text
              style={
                styles.calendarIconText
              }
            >
              ▦
            </Text>
          </View>
        </View>

        {/* ================================= */}
        {/* PAGE TITLE                        */}
        {/* ================================= */}

        <View
          style={
            styles.intro
          }
        >
          <Text
            style={
              styles.eyebrow
            }
          >
            YOUR PROGRESS
          </Text>

          <Text
            style={
              styles.title
            }
          >
            See how you're doing.
          </Text>

          <Text
            style={
              styles.description
            }
          >
            Track your calorie intake
            over time and compare it
            with your daily target.
          </Text>
        </View>

        {/* ================================= */}
        {/* RANGE SELECTOR                    */}
        {/* ================================= */}

        <View
          style={
            styles.segmented
          }
        >
          <RangeButton
            label="Week"
            selected={
              range === "Week"
            }
            onPress={() =>
              setRange(
                "Week"
              )
            }
          />

          <RangeButton
            label="Month"
            selected={
              range === "Month"
            }
            onPress={() =>
              setRange(
                "Month"
              )
            }
          />
        </View>

        {/* ================================= */}
        {/* CHART                             */}
        {/* ================================= */}

        <View
          style={
            styles.chartCard
          }
        >
          <View
            style={
              styles.chartHeader
            }
          >
            <View>
              <Text
                style={
                  styles.chartEyebrow
                }
              >
                CALORIES
              </Text>

              <Text
                style={
                  styles.chartTitle
                }
              >
                Daily intake
              </Text>
            </View>

            <View
              style={
                styles.targetBadge
              }
            >
              <Text
                style={
                  styles.targetBadgeText
                }
              >
                {calorieGoal.toLocaleString()} target
              </Text>
            </View>
          </View>

          {/* Chart area */}

          <View
            style={
              styles.chartArea
            }
          >
            {/* Goal line */}

            <View
              style={[
                styles.goalLine,

                {
                  bottom:
                    `${Math.min(
                      (
                        calorieGoal /
                        chartMaximum
                      ) *
                        100,
                      100
                    )}%`,
                },
              ]}
            >
              <View
                style={
                  styles.goalLineStroke
                }
              />

              <Text
                style={
                  styles.goalLineText
                }
              >
                goal
              </Text>
            </View>

            {/* Bars */}

            <View
              style={
                styles.bars
              }
            >
              {chartData.map(
                (
                  day
                ) => {
                  const hasData =
                    day.calories !==
                    null;

                  const height =
                    hasData
                      ? Math.max(
                          (
                            (day.calories as number) /
                            chartMaximum
                          ) *
                            100,
                          2
                        )
                      : 0;

                  return (
                    <View
                      key={
                        day.key
                      }
                      style={
                        styles.column
                      }
                    >
                      <View
                        style={
                          styles.barArea
                        }
                      >
                        {hasData && (
                          <View
                            style={[
                              styles.bar,

                              {
                                height:
                                  `${height}%`,
                              },
                            ]}
                          />
                        )}
                      </View>

                      <Text
                        style={
                          styles.dayLabel
                        }
                      >
                        {
                          day.label
                        }
                      </Text>
                    </View>
                  );
                }
              )}
            </View>
          </View>

          {/* Empty state */}

          {daysLogged ===
            0 && (
            <View
              style={
                styles.emptyMessage
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No calorie data yet
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Logged days will appear
                here automatically.
              </Text>
            </View>
          )}

          <View
            style={
              styles.chartFooter
            }
          >
            <View
              style={
                styles.legendItem
              }
            >
              <View
                style={
                  styles.legendBar
                }
              />

              <Text
                style={
                  styles.legendText
                }
              >
                Calories consumed
              </Text>
            </View>

            <Text
              style={
                styles.loggedText
              }
            >
              {daysLogged}{" "}
              {daysLogged === 1
                ? "day"
                : "days"}{" "}
              logged
            </Text>
          </View>
        </View>

        {/* ================================= */}
        {/* STATS                             */}
        {/* ================================= */}

        <View
          style={
            styles.statsRow
          }
        >
          <View
            style={
              styles.statCard
            }
          >
            <View
              style={
                styles.statIcon
              }
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                ≈
              </Text>
            </View>

            <Text
              style={
                styles.statValue
              }
            >
              {daysLogged >
              0
                ? averageCalories.toLocaleString()
                : "—"}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              average calories / day
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <View
              style={[
                styles.statIcon,
                styles.maizeIcon,
              ]}
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                ✓
              </Text>
            </View>

            <Text
              style={
                styles.statValue
              }
            >
              {daysLogged}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              days with data
            </Text>
          </View>
        </View>

        {/* ================================= */}
        {/* SUMMARY                           */}
        {/* ================================= */}

        <View
          style={
            styles.summaryCard
          }
        >
          <View
            style={
              styles.summaryMark
            }
          >
            <Text
              style={
                styles.summaryMarkText
              }
            >
              ✦
            </Text>
          </View>

          <View
            style={
              styles.summaryCopy
            }
          >
            <Text
              style={
                styles.chartEyebrow
              }
            >
              {range.toUpperCase()} SUMMARY
            </Text>

            {daysLogged >
            0 ? (
              <>
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  {averageCalories.toLocaleString()} calorie average
                </Text>

                <Text
                  style={
                    styles.summaryDescription
                  }
                >
                  Your average is based
                  only on the{" "}
                  {daysLogged}{" "}
                  {daysLogged === 1
                    ? "day"
                    : "days"}{" "}
                  with recorded calorie
                  data. Missing days are
                  left blank.
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Your history starts here
                </Text>

                <Text
                  style={
                    styles.summaryDescription
                  }
                >
                  Once meals are logged,
                  this page will show your
                  calorie history without
                  filling in days that do
                  not have data.
                </Text>
              </>
            )}
          </View>
        </View>

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * ============================================
 * RANGE BUTTON
 * ============================================
 */

function RangeButton({
  label,
  selected,
  onPress,
}: {
  label: Range;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.rangeButton,

        selected &&
          styles.rangeButtonSelected,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.rangeButtonText,

          selected &&
            styles.rangeButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/*
 * ============================================
 * BRAND
 * ============================================
 */

function Brand() {
  return (
    <View
      style={
        styles.brand
      }
    >
      <View
        style={
          styles.brandMark
        }
      >
        <Text
          style={
            styles.brandM
          }
        >
          M
        </Text>
      </View>

      <Text
        style={
          styles.brandText
        }
      >
        maize
      </Text>
    </View>
  );
}

/*
 * ============================================
 * STYLES
 * ============================================
 */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        "#F8F8F4",
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 22,

      /*
       * Keeps content clear of
       * the bottom tab navigator.
       */
      paddingBottom: 110,
    },

    /* HEADER */

    header: {
      height: 68,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    brand: {
      flexDirection: "row",

      alignItems: "center",

      gap: 9,
    },

    brandMark: {
      width: 28,

      height: 28,

      borderRadius: 7,

      backgroundColor:
        colors.navy,

      alignItems: "center",

      justifyContent:
        "center",

      transform: [
        {
          rotate: "-4deg",
        },
      ],
    },

    brandM: {
      color:
        colors.maize,

      fontSize: 15,

      fontWeight:
        "900",
    },

    brandText: {
      color:
        colors.navy,

      fontSize: 21,

      fontWeight:
        "800",

      letterSpacing:
        -0.8,
    },

    calendarIcon: {
      width: 38,

      height: 38,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 19,

      backgroundColor:
        "#FFFFFF",

      alignItems: "center",

      justifyContent:
        "center",
    },

    calendarIconText: {
      color:
        colors.navy,

      fontSize: 17,

      fontWeight:
        "800",
    },

    /* INTRO */

    intro: {
      paddingTop: 20,

      paddingBottom: 20,
    },

    eyebrow: {
      color:
        "#7A818A",

      fontSize: 8,

      fontWeight:
        "800",

      letterSpacing:
        1.2,
    },

    title: {
      marginTop: 6,

      color:
        colors.navy,

      fontSize: 28,

      lineHeight: 33,

      fontWeight:
        "800",

      letterSpacing:
        -1,
    },

    description: {
      marginTop: 6,

      maxWidth: 300,

      color:
        colors.muted,

      fontSize: 10,

      lineHeight: 16,
    },

    /* SEGMENTED CONTROL */

    segmented: {
      height: 43,

      flexDirection: "row",

      padding: 4,

      marginBottom: 15,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 12,

      backgroundColor:
        "#FFFFFF",
    },

    rangeButton: {
      flex: 1,

      alignItems: "center",

      justifyContent:
        "center",

      borderRadius: 9,
    },

    rangeButtonSelected: {
      backgroundColor:
        colors.navy,
    },

    rangeButtonText: {
      color:
        "#89909A",

      fontSize: 9,

      fontWeight:
        "700",
    },

    rangeButtonTextSelected: {
      color:
        "#FFFFFF",
    },

    /* CHART */

    chartCard: {
      padding: 17,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 18,

      backgroundColor:
        "#FFFFFF",
    },

    chartHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 16,
    },

    chartEyebrow: {
      color:
        "#7A818A",

      fontSize: 7,

      fontWeight:
        "800",

      letterSpacing:
        1.1,
    },

    chartTitle: {
      marginTop: 3,

      color:
        colors.navy,

      fontSize: 17,

      fontWeight:
        "800",
    },

    targetBadge: {
      paddingHorizontal: 9,

      paddingVertical: 6,

      borderRadius: 8,

      backgroundColor:
        "#FFF5C8",
    },

    targetBadgeText: {
      color:
        "#756200",

      fontSize: 7,

      fontWeight:
        "800",
    },

    chartArea: {
      position:
        "relative",

      height: 210,

      borderBottomWidth: 1,

      borderBottomColor:
        "#E6E8EA",
    },

    bars: {
      height: "100%",

      flexDirection: "row",

      alignItems:
        "flex-end",

      gap: 3,
    },

    column: {
      flex: 1,

      height: "100%",

      alignItems:
        "center",

      justifyContent:
        "flex-end",
    },

    barArea: {
      flex: 1,

      width: "100%",

      justifyContent:
        "flex-end",

      alignItems:
        "center",
    },

    bar: {
      width: "70%",

      minWidth: 2,

      maxWidth: 24,

      borderTopLeftRadius:
        5,

      borderTopRightRadius:
        5,

      backgroundColor:
        colors.navy,
    },

    dayLabel: {
      height: 20,

      paddingTop: 6,

      color:
        "#90969D",

      fontSize: 7,

      fontWeight:
        "700",
    },

    /* GOAL LINE */

    goalLine: {
      position:
        "absolute",

      left: 0,

      right: 0,

      zIndex: 5,

      flexDirection: "row",

      alignItems: "center",

      pointerEvents:
        "none",
    },

    goalLineStroke: {
      flex: 1,

      borderTopWidth: 1,

      borderStyle:
        "dashed",

      borderColor:
        "#D8BC31",
    },

    goalLineText: {
      marginLeft: 5,

      color:
        "#A0880C",

      fontSize: 6,

      fontWeight:
        "700",
    },

    /* EMPTY */

    emptyMessage: {
      position:
        "absolute",

      left: 20,

      right: 20,

      top: 125,

      alignItems:
        "center",
    },

    emptyTitle: {
      color:
        colors.navy,

      fontSize: 11,

      fontWeight:
        "700",
    },

    emptyDescription: {
      marginTop: 4,

      color:
        "#9BA0A7",

      fontSize: 8,

      textAlign:
        "center",
    },

    chartFooter: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginTop: 13,
    },

    legendItem: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,
    },

    legendBar: {
      width: 8,

      height: 8,

      borderRadius: 2,

      backgroundColor:
        colors.navy,
    },

    legendText: {
      color:
        "#7A818A",

      fontSize: 7,
    },

    loggedText: {
      color:
        "#9298A0",

      fontSize: 7,

      fontWeight:
        "600",
    },

    /* STATS */

    statsRow: {
      flexDirection: "row",

      gap: 11,

      marginTop: 15,
    },

    statCard: {
      flex: 1,

      minHeight: 130,

      padding: 15,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 16,

      backgroundColor:
        "#FFFFFF",
    },

    statIcon: {
      width: 34,

      height: 34,

      borderRadius: 10,

      backgroundColor:
        "#E9F4EE",

      alignItems: "center",

      justifyContent:
        "center",
    },

    maizeIcon: {
      backgroundColor:
        "#FFF4BF",
    },

    statIconText: {
      color:
        colors.navy,

      fontSize: 15,

      fontWeight:
        "800",
    },

    statValue: {
      marginTop: 13,

      color:
        colors.navy,

      fontSize: 21,

      fontWeight:
        "800",

      letterSpacing:
        -0.6,
    },

    statLabel: {
      marginTop: 3,

      color:
        colors.muted,

      fontSize: 8,

      lineHeight: 12,
    },

    /* SUMMARY */

    summaryCard: {
      flexDirection: "row",

      gap: 12,

      marginTop: 15,

      padding: 16,

      borderWidth: 1,

      borderColor:
        "#E5DB9B",

      borderRadius: 17,

      backgroundColor:
        "#FFFBE7",
    },

    summaryMark: {
      width: 39,

      height: 39,

      borderRadius: 12,

      backgroundColor:
        colors.maize,

      alignItems: "center",

      justifyContent:
        "center",
    },

    summaryMarkText: {
      color:
        colors.navy,

      fontSize: 18,

      fontWeight:
        "900",
    },

    summaryCopy: {
      flex: 1,
    },

    summaryTitle: {
      marginTop: 4,

      color:
        colors.navy,

      fontSize: 13,

      fontWeight:
        "800",
    },

    summaryDescription: {
      marginTop: 5,

      color:
        "#716C59",

      fontSize: 8,

      lineHeight: 13,
    },

    bottomSpace: {
      height: 20,
    },
  });