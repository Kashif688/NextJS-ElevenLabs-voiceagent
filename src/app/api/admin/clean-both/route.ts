import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LeadModel from "@/models/Lead";

export const dynamic = 'force-dynamic';

async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) return uri;
  try {
    const raw = uri.replace('mongodb+srv://', 'http://');
    const parsed = new URL(raw);
    const auth = parsed.username
      ? `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}@`
      : '';
    const host = parsed.hostname;
    const pathname = parsed.pathname || '';
    const searchParams = new URLSearchParams(parsed.search);

    let srvData: any = null;
    try {
      const res = await fetch(`https://dns.google/resolve?name=_mongodb._tcp.${host}&type=SRV`, { cache: 'no-store' });
      srvData = await res.json();
    } catch (e) {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=_mongodb._tcp.${host}&type=SRV`, {
        headers: { Accept: 'application/dns-json' }, cache: 'no-store'
      });
      srvData = await res.json();
    }

    if (!srvData?.Answer || srvData.Answer.length === 0) return uri;

    const hostList = srvData.Answer
      .filter((ans: any) => ans.data)
      .map((ans: any) => {
        const parts = ans.data.trim().split(/\s+/);
        const port = parts[2] || '27017';
        const target = (parts[3] || '').replace(/\.$/, '');
        return `${target}:${port}`;
      })
      .filter((h: string) => !h.startsWith(':'))
      .join(',');

    if (!searchParams.has('ssl') && !searchParams.has('tls')) searchParams.set('ssl', 'true');
    const queryStr = searchParams.toString();
    return `mongodb://${auth}${hostList}${pathname}${queryStr ? `?${queryStr}` : ''}`;
  } catch (err) {
    return uri;
  }
}

export async function GET() {
  try {
    const uri1 = "mongodb+srv://ai3knots_db_user:yFgAwREGFLu1ahrS@cluster0.pojxbbe.mongodb.net/?appName=Cluster0";
    // const uri2 = "mongodb+srv://developer3knots_db_user:5nO4qIc3wCNPAcyb@cluster0.dqfgcg5.mongodb.net";

    const results = [];

    for (const uri of [uri1]) {
      try {
        const resolved = await resolveMongoUri(uri);
        const conn = await mongoose.createConnection(resolved).asPromise();
        const Lead = conn.model('Lead', LeadModel.schema);
        const res = await Lead.deleteMany({});
        results.push({ uri: uri.substring(0, 30) + '...', deletedCount: res.deletedCount });
        await conn.close();
      } catch (e: any) {
        results.push({ uri: uri.substring(0, 30) + '...', error: e.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
