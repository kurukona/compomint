import { CompomintGlobal } from "./type";

/**
 * @function applyBuiltInTemplates
 * @description Applies built-in templates to the Compomint instance.
 * @param {CompomintGlobal["addTmpl"]} addTmpl - The `compomint.addTmpl` function.
 * @returns {void}
 */
const applyBuiltInTemplates = (addTmpl: CompomintGlobal["addTmpl"]): void => {
  // co-Ele is a shorthand for co-Element, it will generate a div element with the given props and event
  addTmpl(
    "co-Ele",
    `<##=data[0]##></##=data[0]##>###compomint.tools.applyElementProps(this, data[1]);##`
  );
  addTmpl(
    "co-Element",
    `##
  data.tag = data.tag || 'div';
  ##
  &lt;##=data.tag##
    ##=data.id ? 'id="' + (data.id === true ? component._id : data.id) + '"' : ''##
    data-co-props="##:data.props##"
    data-co-event="##:data.event##"&gt;
    ##if (typeof data.content === "string") {##
    ##=data.content##
    ##} else {##
      ##%data.content##
    ##}##
  &lt;/##=data.tag##&gt;`
  );
};

export { applyBuiltInTemplates };
