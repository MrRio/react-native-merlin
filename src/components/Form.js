import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import useInputRefs from '../hooks/useInputRefs'
import { validate } from '../utils/validation'
import { filterRelevant } from '../utils/inputs'

const FormContext = React.createContext()

export const useForm = component => {
  const context = React.useContext(FormContext)
  if (context === undefined) {
    throw new Error(`<${component}/> must be used within a <Form /> component.`)
  }

  return context
}

const Form = forwardRef(
  (
    {
      children,
      onSubmit,
      onError,
      values: _values = {},
      errors: _errors = [],
      watch = false,
      watchValues = false,
      watchErrors = false,
    },
    ref
  ) => {
    const [values, setValues] = useState(_values)
    const [errors, setErrors] = useState(_errors)
    const {
      registerInput,
      addInput,
      inputs,
      shouldRecalculate,
    } = useInputRefs()

    useEffect(() => {
      if (watch || watchValues) {
        setValues(_values)
      }
    }, [_values])

    useEffect(() => {
      if (watch || watchErrors) {
        setErrors(_errors)
      }
    }, [_errors])

    const validateAllFields = values => {
      const errors = inputs
        .map(input => validate(input, values[input.name], values))
        .filter(v => v !== true)

      const errorsMappedToNames = errors.reduce((errors, item) => {
        errors[item.name] = item.error
        return errors
      }, {})

      return { valid: !errors.length, errors: errorsMappedToNames }
    }

    const handleSubmit = (event, id) => {
      const { valid, errors } = validateAllFields(values)
      const inputNames = inputs.map(input => input.name)
      const relevantValues = filterRelevant(values, inputNames)

      if (valid) {
        onSubmit && onSubmit(relevantValues, { event, id })
      } else {
        setErrors(errors)
        onError && onError(errors, { event, id })
      }
    }

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }))

    return (
      <FormContext.Provider
        value={{
          values,
          setValues,
          errors,
          setErrors,
          inputs,
          registerInput,
          addInput,
          shouldRecalculate,
          handleSubmit,
        }}
      >
        {children}
      </FormContext.Provider>
    )
  }
)

export default Form