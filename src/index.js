// ======================== OKX API 客户端 ========================
class OKXClient {
  constructor(apiKey, apiSecret, passphrase, isDemo = true) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.passphrase = passphrase;
    this.baseUrl = isDemo ? 'https://www.okx.com' : 'https://www.okx.com';
    this.isDemo = isDemo;
  }

  async _sign(method, path, body = '') {
    const timestamp = new Date().toISOString();
    const message = timestamp + method + path + body;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.apiSecret);
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
    
    return { timestamp, signature };
  }

  async _request(method, path, body = null) {
    const bodyStr = body ? JSON.stringify(body) : '';
    const { timestamp, signature } = await this._sign(method, path, bodyStr);
    
    const headers = {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };
    if (this.isDemo) headers['x-simulated-trading'] = '1';

    const res = await fetch(this.baseUrl + path, {
      method,
      headers,
      body: bodyStr || undefined,
    });
    
    const data = await res.json();
    if (data.code !== '0') throw new Error(`OKX Error ${data.code}: ${data.msg}`);
    return data.data;
  }

  getBalance() {
    return this._request('GET', '/api/v5/account/balance');
  }

  getPositions() {
    return this._request('GET', '/api/v5/account/positions');
  }

  getFills(instType = 'SWAP', limit = 100) {
    return this._request('GET', `/api/v5/trade/fills?instType=${instType}&limit=${limit}`);
  }

  getBills(limit = 100) {
    return this._request('GET', `/api/v5/account/bills?limit=${limit}`);
  }
}

// ======================== 前端 HTML 模板 ========================
function renderDashboard(data) {
  const { balance, positions, fills, bills } = data;
  
  // 计算总权益
  const totalEquity = balance?.[0]?.details?.reduce((sum, d) => sum + parseFloat(d.eq || 0), 0) || 0;
  const totalAvail = balance?.[0]?.details?.reduce((sum, d) => sum + parseFloat(d.availEq || 0), 0) || 0;
  const totalFrozen = balance?.[0]?.details?.reduce((sum, d) => sum + parseFloat(d.frozenBal || 0), 0) || 0;
  
  // 持仓汇总
  const posRows = (positions || []).map(p => {
    const pnl = parseFloat(p.upl || 0);
    const pnlPct = parseFloat(p.uplRatio || 0) * 100;
    const side = p.posSide === 'long' ? '做多' : p.posSide === 'short' ? '做空' : '无';
    const color = pnl >= 0 ? '#22c55e' : '#ef4444';
    return `
      <tr>
        <td>${p.instId}</td>
        <td class="side-${p.posSide}">${side}</td>
        <td>${parseFloat(p.pos).toFixed(4)}</td>
        <td>${parseFloat(p.avgPx).toFixed(2)}</td>
        <td>${parseFloat(p.markPx).toFixed(2)}</td>
        <td style="color:${color}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT</td>
        <td style="color:${color}">${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%</td>
        <td>${p.leverage || 10}x</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="8" class="empty">暂无持仓</td></tr>';

  // 最近成交
  const fillRows = (fills || []).map(f => {
    const side = f.side === 'buy' ? '买入' : '卖出';
    const color = f.side === 'buy' ? '#22c55e' : '#ef4444';
    return `
      <tr>
        <td>${f.instId}</td>
        <td style="color:${color}">${side}</td>
        <td>${parseFloat(f.sz).toFixed(4)}</td>
        <td>${parseFloat(f.px).toFixed(2)}</td>
        <td>${new Date(parseInt(f.ts)).toLocaleString('zh-CN')}</td>
        <td>${f.fee} ${f.feeCcy}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" class="empty">暂无成交记录</td></tr>';

  // 最近账单（盈亏）
  const billRows = (bills || []).filter(b => b.type === '8' || b.type === '9').map(b => {
    const pnl = parseFloat(b.pnl || 0);
    const color = pnl >= 0 ? '#22c55e' : '#ef4444';
    return `
      <tr>
        <td>${b.instId || '-'}</td>
        <td>${b.subType === '8' ? '已实现盈利' : b.subType === '9' ? '已实现亏损' : '其他'}</td>
        <td style="color:${color}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT</td>
        <td>${new Date(parseInt(b.ts)).toLocaleString('zh-CN')}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="4" class="empty">暂无盈亏记录</td></tr>';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OKX 交易机器人监控</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      line-height: 1.6;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 24px; color: #f8fafc; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card {
      background: #1e293b;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #334155;
    }
    .card-label { font-size: 13px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-value { font-size: 28px; font-weight: 700; color: #f8fafc; }
    .card-value.positive { color: #22c55e; }
    .card-value.negative { color: #ef4444; }
    .card-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    th { padding: 14px 16px; text-align: left; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #334155; background: #0f172a; }
    td { padding: 12px 16px; border-bottom: 1px solid #334155; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    .section-title { font-size: 18px; font-weight: 600; margin: 24px 0 16px; color: #f8fafc; }
    .side-long { color: #22c55e; }
    .side-short { color: #ef4444; }
    .empty { color: #64748b; text-align: center; padding: 32px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-demo { background: #3b82f6; color: white; }
    .badge-live { background: #22c55e; color: white; }
    .refresh { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    @media (max-width: 768px) { body { padding: 12px; } .grid { grid-template-columns: 1fr; } table { font-size: 12px; } th, td { padding: 8px 10px; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>OKX 多标交易机器人 <span class="badge badge-demo">模拟盘</span></h1>
    <p class="subtitle">5 标的：ETH / BTC / SOL / XRP / XAU — 1H EMA 交叉策略</p>
    <p class="refresh">数据实时从 OKX API 获取 · 刷新页面更新</p>
    
    <div class="grid">
      <div class="card">
        <div class="card-label">总权益</div>
        <div class="card-value">$${totalEquity.toFixed(2)}</div>
        <div class="card-sub">USDT</div>
      </div>
      <div class="card">
        <div class="card-label">可用余额</div>
        <div class="card-value">$${totalAvail.toFixed(2)}</div>
        <div class="card-sub">可开仓资金</div>
      </div>
      <div class="card">
        <div class="card-label">冻结保证金</div>
        <div class="card-value">$${totalFrozen.toFixed(2)}</div>
        <div class="card-sub">已占用</div>
      </div>
      <div class="card">
        <div class="card-label">当前持仓</div>
        <div class="card-value">${positions?.length || 0}</div>
        <div class="card-sub">标的数量</div>
      </div>
    </div>

    <div class="section-title">当前持仓</div>
    <table>
      <thead>
        <tr><th>标的</th><th>方向</th><th>数量</th><th>开仓价</th><th>标记价</th><th>未实现盈亏</th><th>盈亏比例</th><th>杠杆</th></tr>
      </thead>
      <tbody>${posRows}</tbody>
    </table>

    <div class="section-title">最近成交</div>
    <table>
      <thead>
        <tr><th>标的</th><th>方向</th><th>数量</th><th>成交价</th><th>时间</th><th>手续费</th></tr>
      </thead>
      <tbody>${fillRows}</tbody>
    </table>

    <div class="section-title">最近盈亏记录</div>
    <table>
      <thead>
        <tr><th>标的</th><th>类型</th><th>盈亏</th><th>时间</th></tr>
      </thead>
      <tbody>${billRows}</tbody>
    </table>
  </div>
</body>
</html>`;
}

// ======================== Worker 路由 ========================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const okx = new OKXClient(
      env.OKX_API_KEY,
      env.OKX_API_SECRET,
      env.OKX_API_PASSPHRASE,
      env.OKX_DEMO !== 'false'
    );

    try {
      // 并行获取所有数据
      const [balance, positions, fills, bills] = await Promise.all([
        okx.getBalance().catch(() => []),
        okx.getPositions().catch(() => []),
        okx.getFills().catch(() => []),
        okx.getBills().catch(() => []),
      ]);

      const data = { balance, positions, fills, bills };

      // API 端点
      if (url.pathname === '/api/data') {
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // 默认返回 HTML 页面
      return new Response(renderDashboard(data), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    } catch (err) {
      return new Response(`<h1>Error</h1><pre>${err.message}</pre>`, {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  },
};
