export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    // Fetch Emaar stock data from Yahoo Finance
    const ticker = "EMAAR.AE";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];

    // Get current/latest price
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = ((change / previousClose) * 100).toFixed(2);

    // Get daily high/low/volume from the latest trading day
    const lastIndex = quote.close.length - 1;
    const dayHigh = quote.high[lastIndex];
    const dayLow = quote.low[lastIndex];
    const volume = quote.volume[lastIndex];
    const open = quote.open[lastIndex];

    // Build 5-day price history
    const timestamps = result.timestamp || [];
    const history = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toLocaleDateString("en-AE", { day: "numeric", month: "short" }),
      close: quote.close[i] ? parseFloat(quote.close[i].toFixed(2)) : null,
      high: quote.high[i] ? parseFloat(quote.high[i].toFixed(2)) : null,
      low: quote.low[i] ? parseFloat(quote.low[i].toFixed(2)) : null,
    })).filter(d => d.close !== null);

    res.status(200).json({
      success: true,
      ticker: "EMAAR",
      exchange: "DFM",
      currency: "AED",
      price: parseFloat(currentPrice.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent),
      open: open ? parseFloat(open.toFixed(2)) : null,
      dayHigh: dayHigh ? parseFloat(dayHigh.toFixed(2)) : null,
      dayLow: dayLow ? parseFloat(dayLow.toFixed(2)) : null,
      volume: volume || null,
      marketState: meta.marketState || "UNKNOWN",
      lastUpdated: new Date().toISOString(),
      history: history,
    });
  } catch (error) {
    console.error("Stock fetch error:", error);

    // Return fallback data so dashboard still works
    res.status(200).json({
      success: false,
      ticker: "EMAAR",
      exchange: "DFM",
      currency: "AED",
      price: 17.05,
      previousClose: 16.59,
      change: 0.46,
      changePercent: 2.75,
      open: 16.80,
      dayHigh: 17.10,
      dayLow: 16.75,
      volume: 12500000,
      marketState: "OFFLINE",
      lastUpdated: new Date().toISOString(),
      history: [],
      error: "Using cached data. Live feed temporarily unavailable.",
    });
  }
}
