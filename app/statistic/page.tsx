export default function StatisticPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Statistic</h1>
            <p className="text-muted-foreground">
                Key metrics and performance charts.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder charts */}
                <div className="col-span-1 rounded-xl border bg-card text-card-foreground shadow p-6 min-h-[300px] flex items-center justify-center">
                    Chart Area 1
                </div>
                <div className="col-span-1 lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow p-6 min-h-[300px] flex items-center justify-center">
                    Chart Area 2
                </div>
            </div>
        </div>
    )
}
