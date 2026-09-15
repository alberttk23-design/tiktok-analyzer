import csv
from bisect import bisect_left, bisect_right
from collections import Counter
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent

DATASET_FILE = PROJECT_DIR / "data" / "dataset.csv"
SCORES_FILE = PROJECT_DIR / "data" / "video_scores.csv"
REPORT_FILE = PROJECT_DIR / "data" / "pattern_report.txt"


# ============================================================
# CORE CREATIVE VARIABLES
# ============================================================

CORE_FIELDS = [
    "visual_hook_type",
    "visual_hook_mechanism",
    "product_visible_in_hook",
    "human_visible_in_hook",

    "content_format",
    "pacing",
    "camera_style",
    "transformation",

    "visual_primary_angle",
    "visual_persuasion",
    "visual_proof_mechanism",
    "visual_emotional_trigger",

    "structure_pattern",
    "visual_format",
    "editing_format",

    "human_present",
    "product_interaction",
    "product_closeup",

    "meaningful_speech",
    "spoken_hook_type",
    "spoken_primary_angle",
    "spoken_persuasion",
    "spoken_comparison_present",

    "visual_cta_present",
    "spoken_cta_present",
]


COMBINATION_FIELDS = [
    ("visual_hook_type", "visual_primary_angle"),
    ("visual_hook_type", "visual_proof_mechanism"),
    ("content_format", "visual_primary_angle"),
    ("visual_primary_angle", "visual_proof_mechanism"),
    ("visual_primary_angle", "visual_persuasion"),
    ("visual_hook_type", "content_format"),
    ("visual_hook_type", "visual_format"),
]


# ============================================================
# HELPERS
# ============================================================

def number(value):
    try:
        return float(value or 0)
    except Exception:
        return 0.0


def clean(value):
    value = str(value or "").strip()

    if not value:
        return None

    if value.lower() in {
        "none",
        "null",
        "unknown",
        "nan"
    }:
        return None

    return value


def percentile(values, value):
    """
    Tie-aware percentile.

    Videos with exactly the same metric value receive
    exactly the same percentile.
    """

    if len(values) <= 1:
        return 0.5

    sorted_values = sorted(values)

    left = bisect_left(sorted_values, value)
    right = bisect_right(sorted_values, value)

    average_rank = (left + right - 1) / 2

    return average_rank / (len(values) - 1)


# ============================================================
# PERFORMANCE
# ============================================================

def calculate_performance(rows):

    views_values = [
        number(r.get("views"))
        for r in rows
    ]

    like_values = [
        number(r.get("like_rate"))
        for r in rows
    ]

    comment_values = [
        number(r.get("comment_rate"))
        for r in rows
    ]

    save_values = [
        number(r.get("save_rate"))
        for r in rows
    ]

    repost_values = [
        number(r.get("repost_rate"))
        for r in rows
    ]

    for row in rows:

        views = number(row.get("views"))
        like_rate = number(row.get("like_rate"))
        comment_rate = number(row.get("comment_rate"))
        save_rate = number(row.get("save_rate"))
        repost_rate = number(row.get("repost_rate"))

        views_p = percentile(
            views_values,
            views
        )

        like_p = percentile(
            like_values,
            like_rate
        )

        comment_p = percentile(
            comment_values,
            comment_rate
        )

        save_p = percentile(
            save_values,
            save_rate
        )

        repost_p = percentile(
            repost_values,
            repost_rate
        )

        # -----------------------------------------
        # PROVISIONAL PERFORMANCE RANKING
        #
        # Views remain the primary outcome.
        # Engagement components are independent.
        # No double-counted engagement_rate.
        # -----------------------------------------

        score = (
            0.70 * views_p
            + 0.10 * like_p
            + 0.05 * comment_p
            + 0.10 * save_p
            + 0.05 * repost_p
        )

        row["performance_score"] = round(
            score,
            6
        )

    # Score percentile is calculated AFTER composite score.
    scores = [
        r["performance_score"]
        for r in rows
    ]

    for row in rows:

        p = percentile(
            scores,
            row["performance_score"]
        )

        row["performance_percentile"] = round(
            p,
            6
        )

        # Tie-safe:
        # equal scores = equal percentile = equal group

        if p >= 0.80:
            row["performance_group"] = "WINNER"

        elif p <= 0.20:
            row["performance_group"] = "LOSER"

        else:
            row["performance_group"] = "NORMAL"

    return sorted(
        rows,
        key=lambda x: (
            x["performance_score"],
            number(x.get("views"))
        ),
        reverse=True
    )


# ============================================================
# PATTERN HELPERS
# ============================================================

def group_rows(rows, group):
    return [
        r for r in rows
        if r.get("performance_group") == group
    ]


def rate(rows, field, value):

    if not rows:
        return 0.0

    count = sum(
        clean(r.get(field)) == value
        for r in rows
    )

    return count / len(rows)


def support_thresholds(sample_size):

    if sample_size < 20:
        return None, None

    if sample_size < 50:
        return 3, 2

    return 5, 3


# ============================================================
# SINGLE VARIABLE ANALYSIS
# ============================================================

def analyze_single_patterns(rows):

    min_total, min_creators = support_thresholds(
        len(rows)
    )

    if min_total is None:
        return []

    winners = group_rows(rows, "WINNER")
    normals = group_rows(rows, "NORMAL")
    losers = group_rows(rows, "LOSER")

    results = []

    for field in CORE_FIELDS:

        values = Counter(
            clean(r.get(field))
            for r in rows
            if clean(r.get(field)) is not None
        )

        for value, total_count in values.items():

            creators = {
                r.get("creator")
                for r in rows
                if clean(r.get(field)) == value
                and r.get("creator")
            }

            if total_count < min_total:
                continue

            if len(creators) < min_creators:
                continue

            winner_rate = rate(
                winners,
                field,
                value
            )

            normal_rate = rate(
                normals,
                field,
                value
            )

            loser_rate = rate(
                losers,
                field,
                value
            )

            separation = (
                winner_rate - loser_rate
            )

            # -----------------------------------------
            # SIGNAL CLASSIFICATION
            #
            # Positive / negative only when separation
            # is materially large.
            #
            # Everything else is neutral/table-stakes.
            # -----------------------------------------

            if separation >= 0.25:
                signal_type = "POSITIVE"

            elif separation <= -0.25:
                signal_type = "NEGATIVE"

            else:
                signal_type = "NEUTRAL"

            prevalence = total_count / len(rows)

            results.append({
                "type": signal_type,
                "field": field,
                "value": value,

                "total_count": total_count,
                "prevalence": prevalence,
                "creator_count": len(creators),

                "winner_rate": winner_rate,
                "normal_rate": normal_rate,
                "loser_rate": loser_rate,

                "separation": separation,
            })

    results.sort(
        key=lambda x: (
            abs(x["separation"]),
            x["creator_count"],
            x["total_count"]
        ),
        reverse=True
    )

    return results


# ============================================================
# COMBINATION ANALYSIS
# ============================================================

def analyze_combinations(rows):

    min_total, min_creators = support_thresholds(
        len(rows)
    )

    if min_total is None:
        return []

    winners = group_rows(rows, "WINNER")
    normals = group_rows(rows, "NORMAL")
    losers = group_rows(rows, "LOSER")

    results = []

    for field_a, field_b in COMBINATION_FIELDS:

        combos = Counter()

        for row in rows:

            a = clean(row.get(field_a))
            b = clean(row.get(field_b))

            if a and b:
                combos[(a, b)] += 1

        for (a, b), total_count in combos.items():

            creators = {
                r.get("creator")
                for r in rows
                if clean(r.get(field_a)) == a
                and clean(r.get(field_b)) == b
                and r.get("creator")
            }

            if total_count < min_total:
                continue

            if len(creators) < min_creators:
                continue

            def combo_rate(group):

                if not group:
                    return 0.0

                count = sum(
                    clean(r.get(field_a)) == a
                    and clean(r.get(field_b)) == b
                    for r in group
                )

                return count / len(group)

            winner_rate = combo_rate(
                winners
            )

            normal_rate = combo_rate(
                normals
            )

            loser_rate = combo_rate(
                losers
            )

            separation = (
                winner_rate - loser_rate
            )

            if separation >= 0.25:
                signal_type = "POSITIVE"

            elif separation <= -0.25:
                signal_type = "NEGATIVE"

            else:
                signal_type = "NEUTRAL"

            results.append({
                "type": signal_type,

                "fields":
                    f"{field_a} + {field_b}",

                "value":
                    f"{a} + {b}",

                "total_count":
                    total_count,

                "creator_count":
                    len(creators),

                "winner_rate":
                    winner_rate,

                "normal_rate":
                    normal_rate,

                "loser_rate":
                    loser_rate,

                "separation":
                    separation,
            })

    results.sort(
        key=lambda x: (
            abs(x["separation"]),
            x["creator_count"],
            x["total_count"]
        ),
        reverse=True
    )

    return results


# ============================================================
# REPORT
# ============================================================

def main():

    with open(
        DATASET_FILE,
        newline="",
        encoding="utf-8-sig"
    ) as f:

        rows = list(
            csv.DictReader(f)
        )

    if not rows:
        print("Dataset rỗng.")
        return

    ranked = calculate_performance(
        rows
    )

    # ========================================================
    # SAVE VIDEO SCORES
    # ========================================================

    score_fields = [
        "video_id",
        "creator",
        "url",
        "upload_date",

        "views",
        "like_rate",
        "comment_rate",
        "save_rate",
        "repost_rate",

        "performance_score",
        "performance_percentile",
        "performance_group",

        "visual_hook_type",
        "content_format",
        "visual_primary_angle",
        "visual_proof_mechanism",
        "structure_pattern",
    ]

    with open(
        SCORES_FILE,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=score_fields
        )

        writer.writeheader()

        for row in ranked:

            writer.writerow({
                field: row.get(field, "")
                for field in score_fields
            })

    # ========================================================
    # REPORT HEADER
    # ========================================================

    n = len(ranked)

    lines = []

    lines.append(
        "TIKTOK CROSS-VIDEO PATTERN ANALYSIS"
    )

    lines.append("=" * 72)

    lines.append(
        f"Videos analyzed: {n}"
    )

    if n < 20:
        status = "SMOKE TEST ONLY"

    elif n < 50:
        status = "EXPLORATORY DATASET"

    else:
        status = "STRATEGIC ANALYSIS"

    lines.append(
        f"STATUS: {status}"
    )

    lines.append("")

    # ========================================================
    # PERFORMANCE RANKING
    # ========================================================

    lines.append(
        "PERFORMANCE RANKING"
    )

    lines.append("-" * 72)

    for row in ranked:

        lines.append(
            f'{row["performance_group"]:7} | '
            f'{row["video_id"]} | '
            f'score={row["performance_score"]:.4f} | '
            f'pctl={row["performance_percentile"]:.2f} | '
            f'views={row.get("views")} | '
            f'like={row.get("like_rate")} | '
            f'comment={row.get("comment_rate")} | '
            f'save={row.get("save_rate")} | '
            f'repost={row.get("repost_rate")}'
        )

    # ========================================================
    # IMPORTANT: NO PATTERN CLAIMS BELOW 20 VIDEOS
    # ========================================================

    if n < 20:

        lines.append("")
        lines.append(
            "PATTERN ANALYSIS DISABLED"
        )

        lines.append("-" * 72)

        lines.append(
            "Sample size is below 20 videos."
        )

        lines.append(
            "No positive, negative, neutral, or combination signals "
            "are reported."
        )

        lines.append(
            "Current dataset is used only to validate extraction "
            "and ranking logic."
        )

    else:

        single_signals = (
            analyze_single_patterns(
                ranked
            )
        )

        combinations = (
            analyze_combinations(
                ranked
            )
        )

        positive = [
            s for s in single_signals
            if s["type"] == "POSITIVE"
        ]

        neutral = [
            s for s in single_signals
            if s["type"] == "NEUTRAL"
        ]

        negative = [
            s for s in single_signals
            if s["type"] == "NEGATIVE"
        ]

        # -------------------------------------
        # POSITIVE
        # -------------------------------------

        lines.append("")
        lines.append(
            "POSITIVE SIGNAL CANDIDATES"
        )

        lines.append("-" * 72)

        if not positive:
            lines.append("None.")

        for s in positive[:20]:

            lines.append(
                f'{s["field"]} = {s["value"]} | '
                f'W={s["winner_rate"]:.0%} | '
                f'N={s["normal_rate"]:.0%} | '
                f'L={s["loser_rate"]:.0%} | '
                f'sep={s["separation"]:+.0%} | '
                f'n={s["total_count"]} | '
                f'creators={s["creator_count"]}'
            )

        # -------------------------------------
        # NEUTRAL
        # -------------------------------------

        lines.append("")
        lines.append(
            "NEUTRAL / TABLE-STAKES"
        )

        lines.append("-" * 72)

        if not neutral:
            lines.append("None.")

        for s in neutral[:20]:

            lines.append(
                f'{s["field"]} = {s["value"]} | '
                f'W={s["winner_rate"]:.0%} | '
                f'N={s["normal_rate"]:.0%} | '
                f'L={s["loser_rate"]:.0%} | '
                f'n={s["total_count"]} | '
                f'creators={s["creator_count"]}'
            )

        # -------------------------------------
        # NEGATIVE
        # -------------------------------------

        lines.append("")
        lines.append(
            "NEGATIVE SIGNAL CANDIDATES"
        )

        lines.append("-" * 72)

        if not negative:
            lines.append("None.")

        for s in negative[:20]:

            lines.append(
                f'{s["field"]} = {s["value"]} | '
                f'W={s["winner_rate"]:.0%} | '
                f'N={s["normal_rate"]:.0%} | '
                f'L={s["loser_rate"]:.0%} | '
                f'sep={s["separation"]:+.0%} | '
                f'n={s["total_count"]} | '
                f'creators={s["creator_count"]}'
            )

        # -------------------------------------
        # COMBINATIONS
        # -------------------------------------

        lines.append("")
        lines.append(
            "COMBINATION SIGNAL CANDIDATES"
        )

        lines.append("-" * 72)

        if not combinations:
            lines.append("None.")

        for s in combinations[:20]:

            lines.append(
                f'{s["type"]} | '
                f'{s["fields"]} | '
                f'{s["value"]} | '
                f'W={s["winner_rate"]:.0%} | '
                f'N={s["normal_rate"]:.0%} | '
                f'L={s["loser_rate"]:.0%} | '
                f'n={s["total_count"]} | '
                f'creators={s["creator_count"]}'
            )

    lines.append("")
    lines.append(
        "NOTE: performance ranking is provisional and "
        "does not prove causation."
    )

    REPORT_FILE.write_text(
        "\n".join(lines),
        encoding="utf-8"
    )

    print(
        f"Created: {SCORES_FILE}"
    )

    print(
        f"Created: {REPORT_FILE}"
    )

    print(
        f"Videos analyzed: {n}"
    )

    print(
        f"STATUS: {status}"
    )


if __name__ == "__main__":
    main()
