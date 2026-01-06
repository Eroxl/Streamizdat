import Chat from "@/components/Chat";
import "./styles.css";

export default function ChatPopout() {
    return (
        <div className="absolute top-0 left-0 right-0 bottom-0 h-screen w-screen bg-transparent" style={{
            fontSize: "2rem",
        }}>
            <Chat readonly />
        </div>
    )
}
