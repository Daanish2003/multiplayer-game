import { Button } from "./ui/button"

export default function LeaveRoomButton({ 
    handleLeaveRoom
}: {
    handleLeaveRoom: () => void
}) {
  return (
    <Button
    onClick={handleLeaveRoom}
    variant={"destructive"}
    size={"lg"}
    >
        Leave
    </Button>
  )
}
