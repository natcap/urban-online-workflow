export default function PopupComponent(props) {
  const {
    message,
    handleClose,
    toggleEditMenu
  } = props;

  return (
    <>
      <button
        onClick={() => handleClose() }
        className="ol-popup-closer" />
      <div id="popup-content">
        {message}
      </div>
      <button onClick={() => toggleEditMenu() }>
        Edit
      </button>
    </>
  );
}
