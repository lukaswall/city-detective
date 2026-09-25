// Registry of available cases. To add a country:
// 1. create case-<id>.js defining window.CASE_<ID>
// 2. add its id here and a <script> tag in index.html
window.CASE_REGISTRY = [
  { id: 'thailand', loader: function () { return window.CASE_THAILAND; } }
];
