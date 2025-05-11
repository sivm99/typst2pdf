const exampleTypstCode = `#set page(
  paper: "us-letter",
  margin: (x: 2.5cm, y: 3cm),
)

#set text(
  font: "New Computer Modern",
  size: 11pt,
)

= PDF Generator Demo

This is an example document created with Typst.

== Features

- *Automatic* layout and formatting
- _Beautiful_ mathematical typesetting
- #emph[Easy] to use syntax

#figure(
  rect(width: 100%, height: 35pt, fill: gradient.linear(blue.lighten(30%), blue.lighten(80%), blue.lighten(30%), angle: 45deg)),
  caption: [A sample figure with gradient],
)

$ x^2 + y^2 = z^2 $
`;
export default exampleTypstCode;
