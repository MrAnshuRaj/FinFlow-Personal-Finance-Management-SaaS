import { Accounts, Analytics, Budgets, Goals, ImportExport, Recurring, Settings, Transactions } from "@/components/sections";
import { notFound } from "next/navigation";
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;const views:Record<string,React.ReactNode>={accounts:<Accounts/>,transactions:<Transactions/>,budgets:<Budgets/>,recurring:<Recurring/>,goals:<Goals/>,analytics:<Analytics/>,"import-export":<ImportExport/>,settings:<Settings/>};return views[section]||notFound();}
