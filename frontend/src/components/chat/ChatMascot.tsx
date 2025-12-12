import { useEffect, useState } from 'react'

type ChatMascotProps = {
    state: 'idle' | 'thinking' | 'sleeping'
}

function ChatMascot({ state }: ChatMascotProps) {
    const [blink, setBlink] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(true)
            setTimeout(() => setBlink(false), 200)
        }, 4000 + Math.random() * 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="relative flex h-48 w-40 flex-col items-center justify-center">
            {/* Teddy Bear Container */}
            <div
                className={`relative transition-transform duration-500 ease-in-out ${state === 'thinking' ? 'animate-bounce-rapid' : 'animate-float'
                    }`}
            >
                {/* Ears */}
                <div className="absolute -top-3 -left-2 h-10 w-10 rounded-full bg-amber-600 shadow-sm" />
                <div className="absolute -top-3 -right-2 h-10 w-10 rounded-full bg-amber-600 shadow-sm" />
                <div className="absolute -top-1 -left-0.5 h-6 w-6 rounded-full bg-amber-300/80" />
                <div className="absolute -top-1 -right-0.5 h-6 w-6 rounded-full bg-amber-300/80" />

                {/* Head */}
                <div className="relative z-10 h-28 w-32 rounded-[2.5rem] bg-amber-500 shadow-lg">
                    {/* Eyes */}
                    <div className="absolute top-10 flex w-full justify-center gap-6">
                        <div className={`h-3 w-3 rounded-full bg-slate-900 transition-all duration-150 ${blink ? 'scale-y-10' : 'scale-y-100'}`}>
                            <div className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-white opacity-80" />
                        </div>
                        <div className={`h-3 w-3 rounded-full bg-slate-900 transition-all duration-150 ${blink ? 'scale-y-10' : 'scale-y-100'}`}>
                            <div className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-white opacity-80" />
                        </div>
                    </div>

                    {/* Snout */}
                    <div className="absolute top-14 left-1/2 h-10 w-12 -translate-x-1/2 rounded-xl bg-amber-200">
                        {/* Nose */}
                        <div className="absolute top-2 left-1/2 h-3 w-4 -translate-x-1/2 rounded-full bg-slate-800" />
                        {/* Mouth */}
                        <div className="absolute bottom-2 left-1/2 h-2 w-4 -translate-x-1/2 rounded-full border-b-2 border-slate-800" />
                    </div>

                    {/* Blush */}
                    <div className="absolute top-16 left-4 h-3 w-4 rounded-full bg-rose-300/60 blur-sm" />
                    <div className="absolute top-16 right-4 h-3 w-4 rounded-full bg-rose-300/60 blur-sm" />
                </div>

                {/* Body */}
                <div className="relative -mt-4 mx-auto h-24 w-28 rounded-[2rem] bg-amber-500 shadow-md">
                    {/* Belly */}
                    <div className="absolute top-6 left-1/2 h-14 w-16 -translate-x-1/2 rounded-full bg-amber-200/80" />
                </div>

                {/* Arms */}
                {/* Left Arm (Waving if thinking) */}
                <div
                    className={`absolute top-24 -left-6 h-16 w-8 origin-top-right rounded-full bg-amber-600 shadow-sm ${state === 'thinking' ? 'animate-wave' : 'rotate-12'
                        }`}
                />
                {/* Right Arm */}
                <div className="absolute top-24 -right-6 h-16 w-8 -rotate-12 rounded-full bg-amber-600 shadow-sm" />

                {/* Legs */}
                <div className="absolute bottom-0 left-2 h-12 w-10 rounded-b-2xl rounded-t-lg bg-amber-600 shadow-sm" />
                <div className="absolute bottom-0 right-2 h-12 w-10 rounded-b-2xl rounded-t-lg bg-amber-600 shadow-sm" />

                {/* Paws */}
                <div className="absolute bottom-1 left-4 h-4 w-6 rounded-full bg-amber-200" />
                <div className="absolute bottom-1 right-4 h-4 w-6 rounded-full bg-amber-200" />
            </div>

            {/* Shadow */}
            <div className="mt-1 h-3 w-24 rounded-[50%] bg-slate-900/10 blur-md dark:bg-black/40" />

            {/* Speech Bubble */}
            <div
                className={`absolute -right-8 -top-8 rounded-2xl rounded-bl-none border-2 border-slate-100 bg-white px-4 py-2 font-bold text-slate-700 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${state === 'thinking' ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                    }`}>
                <span className="animate-pulse">Thinking!</span> ʕ·͡ᴥ·ʔ
            </div>
        </div>
    )
}

export default ChatMascot
