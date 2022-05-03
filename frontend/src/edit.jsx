// import Dropdown from 'react-bootstrap/Dropdown';

export default function EditMenu(props) {


  const { open } = props
  console.log('render edit menu', open);

  if (open) {
    return (
      <div className={"menu-container"}>
        <span>Wallpaper with pre-made></span>
        {/*<Dropdown>

        </Dropdown>*/}
      </div>
    );
  } else {
    return <div />
  }
}
