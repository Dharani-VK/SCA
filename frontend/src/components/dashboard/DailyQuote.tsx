import { useState, useEffect } from 'react'
import Card from '../common/Card'
import { LightBulbIcon } from '@heroicons/react/24/outline'

const QUOTES = [
    { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats" },
    { text: "Change is the end result of all true learning.", author: "Leo Buscaglia" },
    { text: "You don't understand anything until you learn it more than one way.", author: "Marvin Minsky" },
]

function DailyQuote() {
    const [quote, setQuote] = useState({ text: '', author: '' })

    useEffect(() => {
        // Pick a deterministic quote based on the day of the year so it persists for the day
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
        setQuote(QUOTES[dayOfYear % QUOTES.length])
    }, [])

    return (
        <Card>
            <div className="flex items-start gap-4">
                <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <LightBulbIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Thought of the Day
                    </h3>
                    <blockquote className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-200">
                        "{quote.text}"
                    </blockquote>
                    <p className="mt-1 text-sm text-slate-500">&mdash; {quote.author}</p>
                </div>
            </div>
        </Card>
    )
}

export default DailyQuote
