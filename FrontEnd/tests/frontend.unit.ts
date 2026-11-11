import assert from "node:assert/strict";
import { test } from "node:test";

import { formatCurrency, formatDate, cn } from "../lib/utils";
import { getNavbarSearchPlaceholder } from "../lib/navbar";
import { getCropCardPriceDiff } from "../lib/crop-card";

test("cn merges conflicting tailwind classes", () => {
    assert.equal(cn("px-2", "px-4"), "px-4");
});

test("formatCurrency formats RWF values", () => {
    const expected = new Intl.NumberFormat("en-RW", {
        style: "currency",
        currency: "RWF",
        minimumFractionDigits: 0,
    }).format(5000);

    assert.equal(formatCurrency(5000), expected);
});

test("formatDate formats dates for the dashboard", () => {
    const expected = new Date("2026-05-05").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    assert.equal(formatDate("2026-05-05"), expected);
});

test("navbar placeholder changes by role", () => {
    assert.equal(
        getNavbarSearchPlaceholder("buyer"),
        "Search crops or districts..."
    );
    assert.equal(
        getNavbarSearchPlaceholder("farmer"),
        "Search transactions..."
    );
});

test("crop card price diff is calculated from asking and suggested price", () => {
    assert.equal(getCropCardPriceDiff(1200, 1000), 20);
    assert.equal(getCropCardPriceDiff(800, 1000), -20);
    assert.equal(getCropCardPriceDiff(0, 1000), null);
});