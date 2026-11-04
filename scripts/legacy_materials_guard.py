"""Require an explicit acknowledgement before regenerating withdrawn legacy materials."""

import os
import sys


def require_legacy_materials_acknowledgement() -> None:
    expected = "I_HAVE_REVIEWED_THE_UNVERIFIED_CLAIMS"
    if os.environ.get("APEX_ENABLE_LEGACY_MATERIAL_GENERATION") != expected:
        print(
            "Blocked legacy generator: this script can recreate withdrawn dashboard pages or "
            "unverified investor, customer, pricing, hardware, and readiness claims. Review and "
            "rewrite its source against current evidence before explicitly enabling it.",
            file=sys.stderr,
        )
        raise SystemExit(2)
