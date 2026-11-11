export function getCropCardPriceDiff(
    askingPrice?: number | null,
    aiSuggestedPrice?: number | null
) {
    if (!askingPrice || !aiSuggestedPrice) {
        return null;
    }

    return ((askingPrice - aiSuggestedPrice) / aiSuggestedPrice) * 100;
}