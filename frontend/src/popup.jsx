export default function PopupComponent(props) {
  const {
    location,
    message,
    overlay,
    toggleEditMenu
  } = props;

  return (
    <>
      <button
        onClick={() => {
          overlay.setPosition(undefined);
        }}
        id="popup-closer"
        className="ol-popup-closer" />
      <div id="popup-content">{message}</div>
      <button
        onClick={() => {
          toggleEditMenu()
        }}>
        Edit
      </button>
    </>
  );
}
