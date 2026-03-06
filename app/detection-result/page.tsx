export default function DetectionResultPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Detection Result</h1>
            <p className="text-muted-foreground">
                View the recent outputs and analyses from detection models.
            </p>
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                No recent detections found.
            </div>
        </div>
    )
}
